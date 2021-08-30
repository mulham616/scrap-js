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

axiosCookieJarSupport(axios);

const cookieJar = new tough.CookieJar();

axios.defaults.jar = cookieJar

const urls = {
    host: 'https://pje.tjma.jus.br',
    loginPage: 'https://pje.tjma.jus.br/pje/login.seam',
    loginUrl: 'https://pje.tjma.jus.br/pje/logar.seam',
    listViewUrl: 'https://pje.tjma.jus.br/pje/Processo/ConsultaProcesso/listView.seam'
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
        console.log(e)
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
        cookieJar,
        virtualConsole: 
    });
    fs.writeFileSync("test.html", dom.serialize())
    return new Promise((resolve, reject) => {
        dom.window.onload = resolve(dom)
    })
    /*
    $("#fPP:searchProcessos").click()
    do{
        await timer(1000)
        console.log("loading..")
    }while($("#_viewRoot:status").css('display') == 'block')
    */
//    console.log(dom.window.$)
}

async function extractData(url){
    // https://pje.tjma.jus.br/pje/Processo/ConsultaProcesso/listView.seam#
    // https://pje.tjma.jus.br/pje/Processo/ConsultaProcesso/Detalhe/listProcessoCompletoAdvogado.seam?id=886456&ca=c5e3ac05ece2d990b79a4a108d59ae9042b917272a53aa7787025d9504ca6a895abb21735389dfa5e81c2aab3a504464
    // <a class="btn-link btn-condensed" href="#" id="fPP:processosTable:886456:j_id445" name="fPP:processosTable:886456:j_id445" 
    // onclick="A4J.AJAX.Submit('fPP',event,{'similarityGroupingId':'fPP:processosTable:886456:j_id445','parameters':{'fPP:processosTable:886456:j_id445':'fPP:processosTable:886456:j_id445','idProcessoSelecionado':886456,'ajaxSingle':'fPP:processosTable:886456:j_id445'} } );return false;"
    // title="0000034-76.2016.8.10.0125"><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">0000034-76.2016.8.10.0125</font></font></a><a class="btn-link btn-condensed" href="#" id="fPP:processosTable:886456:j_id445" name="fPP:processosTable:886456:j_id445" onclick="A4J.AJAX.Submit('fPP',event,{'similarityGroupingId':'fPP:processosTable:886456:j_id445','parameters':{'fPP:processosTable:886456:j_id445':'fPP:processosTable:886456:j_id445','idProcessoSelecionado':886456,'ajaxSingle':'fPP:processosTable:886456:j_id445'} } );return false;" title="0000034-76.2016.8.10.0125"><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">0000034-76.2016.8.10.0125</font></font></a>
    // fPP:processosTable:996954:j_id445
    // fPP:processosTable:tb > tr > td:first > a
    const request = axios.get("https://pje.tjma.jus.br/pje/Processo/ConsultaProcesso/Detalhe/listProcessoCompletoAdvogado.seam?id=886456&ca=c5e3ac05ece2d990b79a4a108d59ae9042b917272a53aa7787025d9504ca6a895abb21735389dfa5e81c2aab3a504464")
    try{
        const response = await request
        fs.writeFileSync("test.html", response.data)
    }
    catch(e){
        console.error(e)
    }
}

async function downloadFile(){
    /**
     * var a=function(){if (!confirm('Confirma o download do documento?')) return false;};var b=function(){if(typeof jsfcljs == 'function'){jsfcljs(document.getElementById('detalheDocumento'),{'detalheDocumento:download':'detalheDocumento:download'},'');}return false};return (a()==false) ? false : b();
     */
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
        console.error(e)
    }
}

async function getDatabase(){
    const JsonData = mongoose.model('JsonData')
    const datas = await JsonData.find()
}

void async function main(){
    await login()

    const dom = await loadList()
    loadJquery(dom)
    // console.log()
    console.log(document.getElementById("fPP:searchProcessos").outerHTML)
    // await timer(1000)
    // await saveJson2Mongo(testdata)
    // await getDatabase()
    // await extractData()
}()

const testdata = {
    "num_process": "0800097-04.2017.8.10.0135",
    "details": [
        { "key": "Classe judicial", "value": "EXECUÇÃO DE TÍTULO EXTRAJUDICIAL (159)" },
        { "key": "Jurisdição", "value": "Fórum da Comarca de Tuntum" },
        { "key": "Valor da causa", "value": "R$ 1.916,50" },
    ],
    "polo_active": {
        "name": "AUDIOLAR MOVEIS E ELETROS LTDA", 
        "CNPJ": "11.828.573/0001-24", 
        "type": "EXEQUENTE",
        "parts": [
            {"name": "GEORGE MUNIZ RIBEIRO REIS", "type": "ADVOGADO" },
            {"name": "SARA MANUELE COSTA DOS REIS", "type": "ADVOGADO" }
        ]
    },
    "polo_passivo": {
        "name": "ADRIANO HENRIQUE ANDRADE SANTOS - ME", 
        "CNPJ": "24.563.772/0001-08", 
        "type": "EXECUTADO",
        "parts": []
    },
    "events": [
        { 
            "date": "07/08/2021 03:06", 
            "description": "DECORRIDO PRAZO DE ADRIANO HENRIQUE ANDRADE SANTOS - ME EM 21/07/2021 23:59.",
            "items": []
        },
        { 
            "date": "15/08/2021 16:57", 
            "description": "",
            "items": [
                { 
                    "number": "49137915", 
                    "title": "Petição", 
                    file: "", 
                    childs: [
                        { "number": "49137917", "title": "Petição (Petição Habilitação Processo)", file: "/asdasd.pdf" },
                        { "number": "49137919", "title": "Procuração (Doc. 01 Procuração Audiolar Moveis Atualizada)", file: "/asdasd.pdf" },
                    ]						
                }
            ]
        }
    ]
}