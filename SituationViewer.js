// import * as  Cesium from 'cesium'
// import "cesium/Build/Cesium/Widgets/widgets.css"

// const { Timeline } = require("cesium");

let _viewer = null;
let _modelConfig = null;
// 用于存储定时器的ID 
let _intervalId = null;
//记录当前所有实体
let _unitInfos = new Map();



function initCesiumViewer() {
    //Add your ion access token from cesium.com/ion/ 
    Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI1OWIxMDNkNC04MDE5LTRjY2MtYTI4Ny1lZTU1YzljOGM1ODUiLCJpZCI6MjQxOTM3LCJpYXQiOjE3MjY0OTAwNDh9.AOYq6P--0rj2SZCSMJokWzQbkg5CqAd5Qv4RHNqG8FQ';
    //var viewer = new Cesium.Viewer('cesiumContainer');
    _viewer = new Cesium.Viewer('cesiumContainer', {
        infoBox: false,
        selectionIndicator: true,
        shadows: true,
        shouldAnimate: true,
        animation: false,
        timeline: false
    });


    // //加载数据
    // _viewer.dataSources.add(
    //     Cesium.GeoJsonDataSource.load(
    //         "./SampleData/ne_10m_us_states.topojson"
    //     )
    // )


    // _viewer.selectedEntityChanged.addEventListener(function(selectedEntity) {
    //     if (selectedEntity) {
    //         _viewer.trackedEntity = selectedEntity;
    //         // 选中了实体
    //         //console.log('选中了实体:', selectedEntity);
    //     }
    // });
    const position = Cesium.Cartesian3.fromDegrees(116, 20);
    var orientation = Cesium.Transforms.headingPitchRollQuaternion(position, new Cesium.HeadingPitchRoll(-Cesium.Math.PI_OVER_TWO, 0, 0));



    const entity = _viewer.entities.add({
        id: "dsa",
        name: "fdasdsa",
        properties: {
            "mzUnit": "Target Boat 3",
            "mnID": 6,
            "mnModelType": "MTYPE_SURFACE",
            "mzClass": "Patrol Boat",
            "alliance": 2,
            "mfLon_rad": 2.1026866438846916,
            "mfLat_rad": 0.4232423392279987,
            "mfAlt_m": 0,
            "mfHeading_rad": 1.5707963705062866,
            "mfClimbAngle_rad": 0,
            "mfYaw_rad": 0,
            "mfPitch_rad": 0,
            "mfRoll_rad": -0.005540387239307165,
            "mfSpeed_kts": 0
        },
        position: position,
        orientation: orientation,
        model: {
            uri: "./models/AIR.glb",
            minimumPixelSize: 128,
            maximumPixelSize: 200,
            maximumScale: 20000
        }
    })



    //    _viewer.entities.add({

    //         position: position,
    //         orientation: orientation,
    //         model: {
    //             uri: "./models/AIR.glb",
    //             minimumPixelSize: 128,
    //             maximumPixelSize: 200,
    //             maximumScale: 20000
    //         }
    //     })
    // _viewer.camera.lookAt(
    //     position,
    //     new Cesium.HeadingPitchRange(
    //         Cesium.Math.toRadians(0),
    //         Cesium.Math.toRadians(0),
    //         20
    //     ))

    //菜单
    const container = document.getElementById("popup");
    const content = document.getElementById("popup-content");
    const closer = document.getElementById("popup-closer");
    let handler = new Cesium.ScreenSpaceEventHandler(_viewer.scene.canvas);
    let cartesian = null;
    let pick  = null;
    handler.setInputAction(e => {
        console.log("e:", e)
        console.log("屏幕坐标:", e.position)
        pick = _viewer.scene.pick(e.position);
        console.log("当前实体:", pick)
        if (Cesium.defined(pick)) {
            console.log("实体属性：", pick.id.properties.getValue());
            let unitInfo = pick.id.properties.getValue()
            function objectToString(obj) { 
                let str = "<ul>";  
                for (let key in obj) {  
                    if (obj.hasOwnProperty(key)) {  
                        str += `<li>${key}: ${obj[key]}</li>`;
                    }  
                }  
                str += "</ul>"; 
                return str;  
            }  
            
            content.innerHTML = `<div>${objectToString(unitInfo)}</div>`

            let ray = _viewer.camera.getPickRay(e.position);
        
            container.style.visibility = "visible"
            // container.style.right = e.position.x - 48 + "px"
            // container.style.top =  e.position.y - 88 + "px"
            // container.style.right =  "200px"
            // container.style.top =   "20px"
        }
        else {
            container.style.visibility = "hidden"
           
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    
    // 关闭弹窗
    closer.onclick = () => {
        container.style.visibility = "hidden"
        cartesian = null;
    }

    // 改变鼠标样式
    handler.setInputAction((e) => {
        let pick = _viewer.scene.pick(e.endPosition);
        if (Cesium.defined(pick)) {
            _viewer._container.style.cursor = "pointer"
        } else {
            _viewer._container.style.cursor = ""
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

}
function initUI() {

    // 获取按钮元素并添加事件监听器  
    document.getElementById('startButton').addEventListener('click', function() {
        // 替换下面的URL为你的目标URL 
        startTimer('http://localhost:8081/simdata');
    });

    document.getElementById('stopButton').addEventListener('click', function() {
        stopTimer();
    });
    document.getElementById('sendcmdButton').addEventListener('click', function() {
        sendCmd('http://localhost:8081/cmd',document.getElementById('pythonCode').value);
    });

}

//读取模型配置
async function readConfig() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        _modelConfig = await response.json();

    } catch (error) {
        console.error('There was a problem with your fetch operation:', error);
    }
    return null;
}


// class UnitInfo {
//     constructor(mnID, alliance, mnModelType, mzUnit, mzClass, mfLon_rad, mfLat_rad, mfAlt_m, mfHeading_rad, mfClimbAngle_rad, mfYaw_rad, mfPitch_rad, mfRoll_rad, mfSpeed_kts) {
//         this.mnID = mnID;
//         this.alliance = alliance;
//         this.mnModelType = mnModelType;
//         this.mzUnit = mzUnit;
//         this.mzClass = mzClass;
//         this.mfLon_rad = mfLon_rad;
//         this.mfLat_rad = mfLat_rad;
//         this.mfAlt_m = mfAlt_m;
//         this.mfHeading_rad = mfHeading_rad;
//         this.mfClimbAngle_rad = mfClimbAngle_rad;
//         this.mfYaw_rad = mfYaw_rad;
//         this.mfPitch_rad = mfPitch_rad;
//         this.mfRoll_rad = mfRoll_rad;
//         this.mfSpeed_kts = mfSpeed_kts;
//         this.sensor = new Array();
//     }
// }
function get3DModelPath(modelConfig, unitInfo) {

    // 如果找到了匹配的type，就返回对应的path  
    // if (unitInfo.mzClass in modelConfig.MClass3DModel) {
    //     return modelConfig.MClass3DModel[unitInfo.mzClass];
    // }
    if (unitInfo.mnModelType in modelConfig.MType3DModel) {
        return modelConfig.MType3DModel[unitInfo.mnModelType];
    }
    console.log(unitInfo);
    // 如果没有找到匹配的type，则返回null或undefined，或者抛出一个错误  
    return null; // 或者 throw new Error(`No path found for type: ${type}`);  
}
function LabelColorFormAlliance(alliance) {
    return new Cesium.Color(alliance * 255 / 16, alliance * 255 / 16, alliance * 255 / 16);
}
//添加model
function addModel(viewer, unitInfo) {
    console.log(unitInfo)
    const position = Cesium.Cartesian3.fromRadians(unitInfo.mfLon_rad, unitInfo.mfLat_rad, unitInfo.mfAlt_m);
    const heading = unitInfo.mfHeading_rad;
    const pitch = unitInfo.mfPitch_rad;
    const roll = unitInfo.mfRoll_rad;
    const hpr = new Cesium.HeadingPitchRoll(heading-Cesium.Math.PI_OVER_TWO, pitch, roll);
    const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);
    const modelPath = get3DModelPath(_modelConfig, unitInfo);
    const entity = viewer.entities.add({
        id: unitInfo.mnID,
        name: unitInfo.mzUnit,
        position: position,
        orientation: orientation,
        properties:unitInfo,
        model: {
            uri: modelPath,
            minimumPixelSize: 128,
            maximumPixelSize: 200,
            maximumScale: 20000
        },
        label: {
            text: JSON.stringify(unitInfo.mzClass), // 标牌上显示的文本  
            font: '20px monospace', // 字体样式  
            style: Cesium.LabelStyle.FILL_AND_OUTLINE, // 标牌样式  
            outlineWidth: 2, // 外线宽度  
            fillColor: LabelColorFormAlliance(unitInfo.alliance),
            outlineColor: LabelColorFormAlliance(unitInfo.alliance),
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM, // 垂直对齐方式  
            pixelOffset: new Cesium.Cartesian2(0, -90) // 标牌相对于模型位置的偏移量  
        }
    });
    // viewer.trackedEntity = entity;
}

function removeModel(viewer, unitInfo) {
    viewer.entities.removeById(unitInfo.mnID);
}
/**
 * 
 * @param {新单元} newunitInfos 
 */
function updateUnit(viewer, newunitInfos) {
    console.log()
    //添加少的
    const unitToAdd = new Map();
    for (const [key, value] of newunitInfos) {
        if (!_unitInfos.has(key)) {
            unitToAdd.set(key, value);
            addModel(viewer, value);
        }
    }
    //删除多的
    const unitToDelete = new Map();
    for (const [key, value] of _unitInfos) {
        if (!newunitInfos.has(key)) {
            unitToDelete.set(key, value);
            removeModel(viewer, value);
        }
    }
    //更新有的
    for (const [key, value] of newunitInfos) {
        const entity = viewer.entities.getById(value.mnID);
        const position = Cesium.Cartesian3.fromRadians(value.mfLon_rad, value.mfLat_rad, value.mfAlt_m);
        const heading = value.mfHeading_rad;
        const pitch = value.mfPitch_rad;
        const roll = value.mfRoll_rad;
        const hpr = new Cesium.HeadingPitchRoll(heading-Cesium.Math.PI_OVER_TWO, pitch, roll);
        const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);
        entity.position = new Cesium.CallbackProperty(function() {
            return position;
        }, false);
        entity.orientation = new Cesium.CallbackProperty(function() {
            return orientation;
        }, false);
        entity.id.properties=value;
    }
    _unitInfos = newunitInfos;
}

/**
 * 
 * @param {*} url 
 */
//获得数据
function updateData(url) {

    fetch(url)
        .then(response => {
            // 检查响应是否成功  
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            // 返回的response对象是一个Stream对象，不能直接访问JSON数据  
            // 需要调用json()方法将其转换为JSON格式  
            return response.json();
        })
        .then(data => {
            // 处理JSON数据  
            const newunitInfos = new Map();
            // 在这里处理你的数据  
            data.unitInfo.forEach(obj => {
                newunitInfos.set(obj.mnID, obj);
            });
            updateUnit(_viewer, newunitInfos)
        })
        .catch(error => {
            // 处理请求过程中发生的错误  
            console.error('There was a problem with your fetch operation:', error);
        });

}

function startTimer(url) {  


    //updateData(url, _unitInfos);
    if (_intervalId !== null) {
        // 如果定时器已经启动，则先停止它  
        clearInterval(_intervalId);
    }
    // 设置定时器，每隔5秒调用fetchData函数  
    _intervalId = setInterval(() => {
        updateData(url, _unitInfos);
    }, 50);

}


function stopTimer() {
    if (_intervalId !== null) {
        // 清除定时器  
        clearInterval(_intervalId);
        _intervalId = null; // 重置定时器ID  
    }
}
function sendCmd(url,cmd) {
    // 发送JSON数据  
    fetch(url, {  
        method: 'POST',  
        headers: {  
            'Content-Type': 'text/plain',  
        },  
        body: cmd
    })  
    .then(response => response.json())  
    .then(data => {  
        console.log(data);  
    })  
    .catch((error) => {  
        console.error('Error:', error);  
    });
}



function main() {
    initCesiumViewer();
    initUI();
    readConfig();
}

main()