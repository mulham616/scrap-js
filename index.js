const jsdom = require('jsdom')
const { JSDOM } = jsdom
const axios = require('axios').default
const qs = require('qs')
const request = require('request')
const decache = require('decache')
const axiosCookieJarSupport = require('axios-cookiejar-support').default
const tough = require('tough-cookie')

axiosCookieJarSupport(axios);

const cookieJar = new tough.CookieJar();

axios.defaults.jar = cookieJar

const defaultHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36', 
    'Origin': 'https://pje.tjma.jus.br', 
    'referer': 'https://pje.tjma.jus.br/pje/login.seam', 
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

const urls = {
    loginPageLink: "https://pje.tjma.jus.br/pje/login.seam",
    loginUrl: "https://pje.tjma.jus.br/pje/logar.seam"
}

function loadJquery(dom){
    decache('jquery')
    global.window = dom.window
    global.document = dom.document
    global.$ = require('jquery')
}

async function login(){
    var data = qs.stringify({
    'username': '98090720315',
    'password': 'mimimi05',
    'newPassword1': '',
    'newPassword2': '' 
    });
    var config = {
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
        console.log(response.headers)
        return true
    }catch(e){
        console.log(e)
        return false
    }
}

void async function main(){
    // const cookieJar = new jsdom.CookieJar(store, options);
    await login()
}()