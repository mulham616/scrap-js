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

const axios_jar = axios.create({
    // WARNING: This value will be ignored.
    jar: new tough.CookieJar(),
  });
   

axiosCookieJarSupport(axios_jar);

const cookieJar = new tough.CookieJar();

axios_jar.defaults.jar = cookieJar

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

Object.assign(axios_jar.defaults.headers, defaultHeaders)

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

    const request = axios_jar(config)
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

async function loadList(){
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

async function extractData(detail_url, p_id){
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
    fs.writeFileSync("1.html", dom.serialize())
    loadJquery(dom)
    $details = document.getElementById('maisDetalhes')
    $dts = $details.querySelectorAll('dt')
    console.log($details, Array.from($dts).length)
    let details = Array.from($dts).map($dt => 
        ({
            key: $($dt).text().trim(),
            value: $($dt.nextElementSibling).text().trim()
        })
    )
    // console.log(details)
    jsondata.details = details
    /******** polo active ********/
    let $poloActiveDiv = document.getElementById('poloAtivo')
    $poloActiveDiv = $poloActiveDiv.querySelector('tbody tr:first-child td:first-child')
    let $firstline = $poloActiveDiv.querySelector('span')
    let $parts = $poloActiveDiv.querySelectorAll('ul li')
    console.log(Array.from($parts).map(each => $(each).text().trim()))
    let firstline = $($firstline).text().trim()
    let parts = Array.from($parts).map(each => $(each).text().trim())
    let reg1 = /(.*): (.*) \((.*)\)/, reg2 = /(.*) \((.*)\)/
    let matches = firstline.match(reg1)
    let polo_active = {
        "name": matches[1], 
        "CNPJ": matches[2], 
        "type": matches[3],
        "parts": parts.map(part => part.match(reg2)).map(
            matches => ({
                name: matches[1],
                type: matches[2]
            })
        )
    }
    $poloPassiveDiv = document.getElementById('poloPassivo')
    $poloPassiveDiv = $poloPassiveDiv.querySelector('tbody tr:first-child td:first-child')
    $firstline = $poloPassiveDiv.querySelector('span')
    $parts = $poloPassiveDiv.querySelectorAll('ul li')
    console.log(Array.from($parts).map(each => $(each).text().trim()))
    firstline = $($firstline).text().trim()
    parts = Array.from($parts).map(each => $(each).text().trim())
    reg1 = /(.*): (.*) \((.*)\)/, reg2 = /(.*) \((.*)\)/
    matches = firstline.match(reg1)
    let polo_passive = {
        "name": matches[1], 
        "CNPJ": matches[2], 
        "type": matches[3],
        "parts": parts.map(part => part.match(reg2)).map(
            matches => ({
                name: matches[1],
                type: matches[2]
            })
        )
    }
    jsondata.polo_active = polo_active
    jsondata.polo_passive = polo_passive
    return jsondata
}

async function saveJson2Mongo(data){
    const JsonData = mongoose.model('JsonData')
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

void async function main(){
    await login()

    const dom = await loadList()
    loadJquery(dom)
    do{
        await timer(1000)
    }while(!window.executarReCaptcha)
    // console.log()
    console.log(document.getElementById("fPP:searchProcessos").outerHTML)
    document.getElementById("fPP:searchProcessos").click()

    await timer(500)
    const $status = document.getElementById('_viewRoot:status.start')
    do{
        await timer(1000)
        console.log("loading..")
    }while($($status).css('display') != 'none')
    
    const $table = document.getElementById('fPP:processosTable:tb')
    const $as = Array.from($($table).find('tr>td:first-child')).map( $td => $td.querySelector('a') )
    console.log("process ids", $as)
    for( let $a of $as ){
        const p_id = $a.id
        console.log($a)
        const detail_url = await (async function(){
            return new Promise(resolve => {
                dom.window.confirm = (text) => {
                    console.log("confirm", text)
                    return true
                }
                dom.window.open = (url, title, features) => {
                    console.log("open new url", url)
                    resolve(url)
                }
                $a.click()
            })
        })()
        await timer(500)
        
        const jsondata = await extractData(detail_url, p_id)
        console.log(jsondata)
    }
}()