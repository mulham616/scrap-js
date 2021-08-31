const jsdom = require('jsdom')
const { JSDOM } = jsdom

function loadJquery(dom){
    delete require.cache[require.resolve('jquery')]
    global.window = dom.window
    global.document = dom.window.document
    global.$ = require('jquery')
    // console.log($)
}

void async function main(){
    const dom = await JSDOM.fromFile('1.html')

    global.window = dom.Window
    global.document = dom.window.document
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
    console.log(details)

    $poloActiveDiv = document.getElementById('poloAtivo')
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
    console.log(polo_active)
}()