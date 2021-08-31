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
}()