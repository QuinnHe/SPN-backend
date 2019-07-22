function init() {

}


function DisEGS() {  
    for (let key in meters) {
        if(Math.random()>0.9999 & meters[key]>0){
            meters[key] = meters[key]-1;
        }
    }
}

function interval_DisEGS(){
    init();
    setInterval(function() {  
        DisEGS();
    }, 5000);
}

module.exports.doDisEGS = interval_DisEGS;
