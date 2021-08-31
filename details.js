const jsdom = require('jsdom')
const { JSDOM } = jsdom

void async function main(){
    const dom = await JSDOM.fromFile('1.html')

    global.window = dom.Window
    global.document = dom.window.document

    $details = document.getElementById('maisDetalhes')
    $dts = $details.querySelectorAll('dt')
    console.log($details, Array.from($dts).length)
}()