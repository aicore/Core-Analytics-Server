let currentApp = localStorage.getItem("currentApp") || "none";
let appsList = [];
let accessKey = localStorage.getItem("accessKey") || "nope";

function getMode() {
    switch (currentTimeWindowMode) {
        case MINUTE_MODE_TIMER: return 'ss';
        case HOUR_MODE_TIMER: return 'mm';
        case DAY_MODE_TIMER: return 'hh';
        case YEAR_MODE_TIMER: return 'dd';
        default: return 'ss';
    }
}

function removeOptions(selectElement) {
    var i, L = selectElement.options.length - 1;
    for(i = L; i >= 0; i--) {
        selectElement.remove(i);
    }
}

function updateAppsList(jsonData) {
    let appNamesSelector = document.getElementById("appNames");
    removeOptions(appNamesSelector);
    let insertedKeys = [];
    for(let key of Object.keys(jsonData)){
        let option = document.createElement("option");
        let newKey = key.split(".")[0];
        if(!insertedKeys.includes(newKey)){
            option.text = newKey;
            insertedKeys.push(newKey);
            appNamesSelector.add(option);
        }
    }
    localStorage.setItem("currentApp", currentApp);
}
function updateAllGraphs() {
    window.fetch(`/status?webStatusApiAccessToken=${accessKey}&timeFrame=${getMode()}`)
        .then(async (response) => {
            let jsonData = await response.json();
            if (response.status === 401) {
                accessKey = window.prompt('Please enter webStatusApiAccessToken(can be found in analytics-config.json): ');
                if(accessKey){
                    localStorage.setItem("accessKey", accessKey);
                    updateAllGraphs();
                }
            } else if(response.ok) {
                updateAppsList(jsonData);
            }
            return jsonData;
        })
        .catch((err)=>{
            console.log("Something went wrong", err);
        });
}

function drawChart(id, graphLabel, dataArray, xAxisTitle, yAxisTitle, xAxisArray) {
    const ctx = window.document.getElementById(id).getContext('2d');
    if(!xAxisArray){
        xAxisArray = [];
        for(let i=0; i<dataArray.length; i++){
            xAxisArray.unshift(i);
        }
    }
    new window.Chart(ctx, {
        type: 'line',
        data: {
            labels: xAxisArray,
            datasets: [{
                label: graphLabel,
                data: dataArray,
                backgroundColor: ['rgba(255, 99, 132, 0.2)'],
                borderColor: ['rgba(255, 99, 132, 1)'],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                yAxes: {
                    title: {
                        display: true,
                        text: yAxisTitle,
                        font: {
                            size: 15
                        }
                    },
                    ticks: {
                        precision: 0
                    }
                },
                xAxes: {
                    title: {
                        display: true,
                        text: xAxisTitle,
                        font: {
                            size: 15
                        }
                    }
                }
            }
        }
    });
}

drawChart("totalNumPostRequests", "yo", [1,2],"seconds", "count");
drawChart("totalNumPostRequests1", "hehe", [1,2,3], "min", "count");
drawChart("totalNumPostRequests2", "seconds", [1,2,3,5],"hour");
updateAllGraphs();
