const jsdom = require('jsdom')
const { JSDOM } = jsdom
const moment = require('moment')

function loadJquery(dom){
    delete require.cache[require.resolve('jquery')]
    global.window = dom.window
    global.document = dom.window.document
    global.$ = require('jquery')
    // console.log($)
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
    console.log(JSON.stringify(events, '', '\t'))
    return events
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
    console.log('poloActive', getPolo('Ativo'))
    console.log('poloPassive', getPolo('Passivo'))
    const $timelineDiv = document.getElementById('divTimeLine:eventosTimeLineElement')
    const eventdates = Array.from($timelineDiv.querySelectorAll(".media.data"))
    moment.locale('pt')
    const events = eventdates.map(date => $(date).text().trim())
        .filter(each => each)
        .map(each => moment(each, 'DD MMM YYYY').format('DD/MM/YYYY'))
        .map(date => (
        {
            date: date
        }
    ))
    // console.log(events)

    getEvents()
}()

/*
media interno

description

divTimeLine:j_id297:0:j_id299:0:j_id301
text-upper texto-movimento


*/