const config           = require(`${__config}/config`);
const eoceanController = require(`${__thirdParty}/e-ocean`);

exports.scheduler = () => {
    const wbTToken = async () => {   //  runs once a day to generate a token  
        eoceanController.generateWBToken()
    }
    setInterval(wbTToken, 8.28e+7)  //  --- 8.64e7 is one day in milliseconds --- 8.28e+7 is 23 hours
}