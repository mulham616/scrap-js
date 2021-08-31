const { Router } = require('express')
const scrap_process = require('../scrapper')

const router = Router()

router.get('/collect/:num_process', async (req, resp) => {
    const num_process = req.params.num_process
    const json = await scrap_process(num_process)
    resp.send(json)
})

exports.default = router