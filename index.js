require('dotenv').config()

const jsdom = require('jsdom')
const { JSDOM } = jsdom
const axios = require('axios').default
const qs = require('qs')
const request = require('request')
const decache = require('decache')
const axiosCookieJarSupport = require('axios-cookiejar-support').default
const tough = require('tough-cookie')
const util = require('util')
const timer = util.promisify(setTimeout)
require('./database/connect')
const mongoose = require('mongoose')
const axios_file_download = require('./helpers/download')
const fs = require('fs')
const moment = require('moment')

// const axios = axios.create({
//     // WARNING: This value will be ignored.
//     jar: new tough.CookieJar(),
//   });
   

axiosCookieJarSupport(axios);

const cookieJar = new tough.CookieJar();

axios.defaults.jar = cookieJar

const urls = {
    host: 'https://pje.tjma.jus.br',
    loginPage: 'https://pje.tjma.jus.br/pje/login.seam',
    loginUrl: 'https://pje.tjma.jus.br/pje/logar.seam',
    listViewUrl: 'https://pje.tjma.jus.br/pje/Processo/ConsultaProcesso/listView.seam',
    detailViewUrl: 'https://pje.tjma.jus.br/pje/Processo/ConsultaProcesso/Detalhe/listProcessoCompletoAdvogado.seam'
}

const defaultHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36', 
    'Origin': 'https://pje.tjma.jus.br', 
    'referer': urls.loginPage, 
    'sec-ch-ua': '"Chromium";v="92", " Not A;Brand";v="99", "Google Chrome";v="92"', 
    'sec-ch-ua-mobile': '?0', 
    'sec-fetch-dest': 'document', 
    'sec-fetch-mode': 'navigate', 
    'sec-fetch-site': 'same-origin', 
    'sec-fetch-user': '?1', 
    'upgrade-insecure-requests': '1', 
    'accept-language': 'en-US,en;q=0.9,ko;q=0.8', 
    'cache-control': 'max-age=0', 
}

Object.assign(axios.defaults.headers, defaultHeaders)

function loadJquery(dom){
    delete require.cache[require.resolve('jquery')]
    global.window = dom.window
    global.document = dom.window.document
    global.$ = require('jquery')
    // console.log($)
}

async function login(){
    const data = qs.stringify({
        'username': '98090720315',
        'password': 'mimimi05',
        'newPassword1': '',
        'newPassword2': '' 
    });
    
    const config = {
        method: 'post',
        url: urls.loginUrl,
        headers: { 
            
            'Content-Type': 'application/x-www-form-urlencoded', 
        },
        data : data
    };

    const request = axios(config)
    try{
        const response = await request
        const cookieString = cookieJar.getCookieStringSync(urls.loginUrl)
        console.log('Login Success:', urls.loginUrl)
        console.log('Cookie:', cookieString)
        return cookieString
    }catch(e){
        // console.log(e)
        return false
    }
}

async function loadListView(){
    const dom = await JSDOM.fromURL(urls.listViewUrl, {
        referrer: urls.loginUrl,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36',
        includeNodeLocations: true,
        storageQuota: 10000000,
        runScripts: 'dangerously',
        resources: "usable",
        cookieJar
    });
    return dom
}
async function downloadFile(dom){
    $download = document.getElementById('detalheDocumento:download')
    const downloadurl = await (function(){
        return new Promise((resolve, reject) => {
            dom.window.confirm = (text) => {
                console.log('download confirm:', text)
            }
            dom.window.open = (url, title, features) => {
                console.log(url, title)
                resolve(url)
            }
            $download.click()
        })
    })()
    axios_file_download(url)
}

async function getEvents(dom){
    const $timelineDiv = document.getElementById('divTimeLine:eventosTimeLineElement')
    const eventdates = $timelineDiv.querySelectorAll(".media.data")
    Array.from(eventdates)
}

async function saveJson2Mongo(data){
    const JsonData = mongoose.model('JsonData')
    await JsonData.findOneAndRemove({ num_process: data.num_process})
    const jsonData = new JsonData()
    jsonData.num_process = data.num_process
    jsonData.json = data
    try{
        await jsonData.save()
        console.log("process saved:", data.num_process)
    }catch(e){
        // console.error(e)
    }
}

function setFilterProcessId(pId){
    const inputIds = [
        "fPP:numeroProcesso:numeroSequencial",
        "fPP:numeroProcesso:numeroDigitoVerificador",
        "fPP:numeroProcesso:ano",
        "fPP:numeroProcesso:ramoJustica",
        "fPP:numeroProcesso:respectivoTribunal",
        "fPP:numeroProcesso:numeroOrgaoJustica",
    ]
    const reg = /(\d+)-(\d+)\.(\d+)\.(\d+).(\d+)\.(\d+)/
    const matches = pId.match(reg)
    for(let i = 0; i < inputIds.length; i++){
        let $input = document.getElementById(inputIds[i])
        $($input).val(matches[i+1])
        console.log(inputIds[i], $($input).val())
    }
}

async function pressSearchBtn(){
    do{
        await timer(1000)
    }while(!window.executarReCaptcha)
    // console.log()
    console.log(document.getElementById("fPP:searchProcessos").id, "pressed")
    document.getElementById("fPP:searchProcessos").click()
    await timer(500)
}

async function waitLoading(){
    const $status = document.getElementById('_viewRoot:status.start')
    do{
        await timer(1000)
        console.log("loading..")
    }while($($status).css('display') != 'none')
}

function findLinkElement(){
    const $table = document.getElementById('fPP:processosTable:tb')
    const $as = Array.from($($table).find('tr>td:first-child')).map( $td => $td.querySelector('a') )
    console.log("process ids", $as.map($a => $a.id))
    return $as[0]
}

async function getProcessDetailUrl($a){
    return new Promise(resolve => {
        window.confirm = (text) => {
            console.log("confirm", text)
            return true
        }
        window.open = (url, title, features) => {
            // console.log("open new url", url)
            resolve(url)
        }
        $a.click()
    })
}

async function getProcessDetail(detail_url, p_id){
    p_id = p_id.split(":")[2]
    const dom = await JSDOM.fromURL(detail_url,
        {
            referrer: urls.loginUrl,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36',
            includeNodeLocations: true,
            storageQuota: 10000000,
            runScripts: 'dangerously',
            resources: "usable",
            cookieJar
        }    
    )
    const jsondata = {}
    jsondata.num_process = p_id

    /****** get details *******/
    loadJquery(dom)
    $details = document.getElementById('maisDetalhes')
    $dts = $details.querySelectorAll('dt')
    console.log($details.id, Array.from($dts).map($dt => $($dt).text().trim()))
    let details = Array.from($dts).map($dt => 
        ({
            key: $($dt).text().trim(),
            value: $($dt.nextElementSibling).text().trim()
        })
    )
    // console.log(details)
    jsondata.details = details

    /******** polo ********/
    jsondata.polo_active = getPolo('Ativo')
    jsondata.polo_passive = getPolo('Passivo')
    jsondata.events = getEvents()
    // jsondata.polo_passive = polo_passive
    return jsondata
}

function getPolo(type){
    $poloDiv = document.getElementById(`polo${type}`)
    $poloDiv = $poloDiv.querySelector('tbody tr:first-child td:first-child')
    let $firstline = $poloDiv.querySelector('span')
    let $parts = $poloDiv.querySelectorAll('ul li')
    console.log(Array.from($parts).map(each => $(each).text().trim()))
    let firstline = $($firstline).text().trim()
    let parts = Array.from($parts).map(each => $(each).text().trim())
    let reg1 = /(.*) - (.*): (.*) \((.*)\)/, reg2 = /(.*) \((.*)\)/
    let matches = firstline.match(reg1)
    let polo = {
        "name": matches[1], 
        [matches[2]]: matches[3],  //CNPJ
        "type": matches[4],
        "parts": parts.map(part => part.match(reg2)).map(
            matches => ({
                name: matches[1],
                type: matches[2]
            })
        )
    }
    return polo
}

function getEvents(){
    const $timelineDiv = document.getElementById('divTimeLine:eventosTimeLineElement')
    const $eventdates = Array.from($timelineDiv.querySelectorAll(".media.data"))
    moment.locale('pt')
    const events = $eventdates
        .map($date => ({
            date: $($date).text().trim(), 
            description: $($date).next().find('.text-upper.texto-movimento').text().trim(),
            time: $($date).next().find('.col-sm-12 small.text-muted.pull-right').text().trim(),
            items: Array.from($($date).next().find('.anexos'))
                .map($item => $($($item).children()[0]).text().trim())
                .filter(text => text)
                .map(text => text.match(/(\d)+ - (.*)/))
                .map(matches => ({
                    number: matches[1],
                    title: matches[2]
                }))
        }))
        .filter(each => each.date)
        .map(each => ({ 
            description: each.description, 
            date:moment(each.date, 'DD MMM YYYY').format('DD/MM/YYYY') + " " + each.time ,
            items: each.items
        }))
    // console.log(JSON.stringify(events, '', '\t'))
    return events
}

void async function main(){
    await login()

    const dom = await loadListView()
    loadJquery(dom)
    
    const processId = process.argv[2] || '0800097-04.2017.8.10.0135'

    setFilterProcessId(processId)
    await pressSearchBtn()
    await waitLoading()
    const $a = findLinkElement()
    const p_id = $a.id
    console.log("process_id:", p_id)
    const detail_url = await getProcessDetailUrl($a)
    await timer(500)
    
    const jsondata = await getProcessDetail(detail_url, p_id)
    console.log(jsondata)
    saveJson2Mongo(jsondata)
}()

