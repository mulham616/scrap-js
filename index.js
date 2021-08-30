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
    global.$ = dom.$
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
        cookieJar
    });
    loadJquery(dom)
    // console.log()
    console.log($("#fPP:searchProcessos").attr('id'))
    $("#fPP:searchProcessos").click()
    do{
        await timer(100)
    }while($("#xxx").attr('hidden') != true)

}

void async function main(){
    // const cookieJar = new jsdom.CookieJar(store, options);
    await login()
    await loadList()
}()