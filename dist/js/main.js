const   Submissions = {
                        page: 1, 
                        pageSize: 10,
                        dateStart: "",
                        dateEnd: "",
                        address: "",
                        sortBy: "Date", 
                        sortVersus: -1,
                        list: [],
                        viewer: {}
                    };

function loadJSON(file, callback) {   
    let http = new XMLHttpRequest();
    http.overrideMimeType("application/json");
    http.open('GET', `./data/${file}`, true); // Replace 'my_data' with the path to your file
    http.onreadystatechange = () => {
        if (http.readyState == 4 && http.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            callback(http.responseText);
        }
    };
    http.send(null);
}

function buildList(){
    loadJSON("Submission.json", function(response) {
        Submissions.list = JSON.parse(response); 
        let start = (Submissions.pageSize*Submissions.page)-(Submissions.pageSize),
            end = start + Submissions.pageSize;
        
        if(Submissions.dateStart !== ''){
            Submissions.list = Submissions.list.filter((submission)=>{
                let subDate = new Date(submission.Date.substr(0, 10)),
                    startDate = new Date(Submissions.dateStart),
                    endDate = Submissions.dateEnd === '' ? new Date(Submissions.dateStart) : new Date(filters.endDate);
                return subDate >= startDate && subDate <= endDate;
            });
        }
        if(Submissions.address !== ''){
            Submissions.list = Submissions.list.filter((submission)=>{
                return submission.Address.toLowerCase().includes(Submissions.address.toLowerCase());
            });
        }
        Submissions.list.sort((a,b) => (a[Submissions.sortBy] > b[Submissions.sortBy]) ? Submissions.sortVersus : ((b[Submissions.sortBy] > a[Submissions.sortBy]) ? Submissions.sortVersus*(-1) : 0)); 
        renderPagination(Submissions.list.length);
        
        Submissions.list = Submissions.list.slice(start,end);
        renderList();
    });
}

function renderList(){
    let container = document.getElementById("submissions-list"),
        html = "";

    Submissions.list.forEach((submission)=>{
        html += `<div data-id="${submission.SubmissionId}" class="item">
                    <div class="id">${submission.SubmissionId}</div>
                    <div class="date">${formatDate(submission.Date)}</div>
                    <div class="address">${submission.Address}</div>
                </div>`;
    });
    container.innerHTML = html;
}

function buildViewer(event){
    let current = event.target.parentElement,
        SubmissionId = current.getAttribute("data-id"),
        currentSubmission = Submissions.list.filter(function(submission) {
            return parseInt(submission.SubmissionId) === parseInt(SubmissionId);
        });;
    Submissions.viewer.answers = [];
    
    loadJSON("SubmissionAnswer.json", function(response) {
        let answers = JSON.parse(response);

        answers = answers.filter(function(answer) {
            return parseInt(answer.SubmissionId) === parseInt(SubmissionId);
        });
        
        loadJSON("Question.json", function(response) {
            let questions = JSON.parse(response);
            answers.forEach((answer)=>{
                    questions = questions.filter(function(question) {
                    return question.QuestionId === answer.QuestionId;
                });
                answer.QuestionText = (questions[0] !== undefined) ? questions[0].Text : null;
                Submissions.viewer.answers.push({QuestionText: answer.QuestionText, Text: answer.Text});
            });
            renderViewer();
            console.log(currentSubmission);
            
            initMap(currentSubmission[0].Latitude,currentSubmission[0].Longitude);
        });
        
    });
}

function renderViewer(){
    let container = document.getElementById("submissions-answers"),
        html = `<ul>`;

    Submissions.viewer.answers.forEach((answer)=>{
        html += `<li>${answer.QuestionText}: ${answer.Text}</li>`;
    });
    html += '</ul>';
    container.innerHTML = html;
    
    
}

function formatDate(strDate='', time=false, reverse=false){
    let dateObj = new Date(strDate),
        dateArr = [ dateObj.getDate(),
                    dateObj.getMonth(),
                    dateObj.getFullYear(), 
                    dateObj.getHours(),
                    dateObj.getMinutes(),
                    dateObj.getSeconds()
                ];

    dateArr = dateArr.map((item,index)=>{
        if(index==1) item += 1;
        return item < 10 ? '0'+item : item;
    });
    let tail = time ? ` ${dateArr[3]}:${dateArr[4]}:${dateArr[5]}`  : '' ;
    return reverse ? `${dateArr[2]}-${dateArr[1]}-${dateArr[0]}${tail}` : `${dateArr[0]}/${dateArr[1]}/${dateArr[2]}${tail}`;
}

function setFilters(event, callback){
    let startDate = document.getElementsByName("searchDate")[0],
        endDate = document.getElementsByName("searchDateEnd")[0],
        address = document.getElementsByName("searchAddress")[0],
        dateValidator = /^(?:(?:31(\/|-|\.)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/|-|\.)(?:0?[1,3-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/|-|\.)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/|-|\.)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/,
        addressValidator = /^[a-zA-Z.,;:?ùàòè ]{3,100}$/;
    
    if(dateValidator.test(formatDate(startDate.value))){
        Submissions.dateStart = formatDate(startDate.value,false,true);
    }
    if(dateValidator.test(formatDate(endDate.value))){
        Submissions.dateEnd = formatDate(endDate.value,false,true);
    }
    if(addressValidator.test(address.value)){
        Submissions.address = address.value;
    }
    if (callback && typeof callback === 'function') callback();
}

/*  
    Event handler. Is possible to set an event at parent node and get the element target without a loop but simply 
    stopping the propagation in the bubbling phase 
*/
function eventWrapper(event,callback) {
    if (event.target !== event.currentTarget) {
        callback(event);
    }
    event.stopPropagation();
}

function renderPagination(count){
    let container = document.getElementById("submissions-pagination"),
        pageCount = Math.ceil(count/Submissions.pageSize),
        html = '<ul>';
        
    for(let i=1; i<=pageCount; i++){
        html += `<li><button type="button" data-page="${i}">${i}</button></li>`;
    }
    html += '</ul>';
    container.innerHTML = html;
    container.addEventListener('click', (event)=>eventWrapper(event,(event)=>{
        let goTo = event.target.getAttribute("data-page");
        if(goTo !== Submissions.page){
            Submissions.page = goTo;
            buildList();
        }
        
    }), false);
}

function initMap(latitude,longitude) {
    let location = new google.maps.LatLng(latitude, longitude),
        map = new google.maps.Map(document.getElementById('map'), {
            center: location,
            zoom: 3
        }),
        coordInfoWindow = new google.maps.InfoWindow();

    coordInfoWindow.setContent(createInfoWindowContent(location, map.getZoom()));
    coordInfoWindow.setPosition(location);
    coordInfoWindow.open(map);

    map.addListener('zoom_changed', function() {
      coordInfoWindow.setContent(createInfoWindowContent(location, map.getZoom()));
      coordInfoWindow.open(map);
    });
  }

  var TILE_SIZE = 256;

  function createInfoWindowContent(latLng, zoom) {
    var scale = 1 << zoom;

    var worldCoordinate = project(latLng);

    var pixelCoordinate = new google.maps.Point(
        Math.floor(worldCoordinate.x * scale),
        Math.floor(worldCoordinate.y * scale));

    var tileCoordinate = new google.maps.Point(
        Math.floor(worldCoordinate.x * scale / TILE_SIZE),
        Math.floor(worldCoordinate.y * scale / TILE_SIZE));

    return [
      'Chicago, IL',
      'LatLng: ' + latLng,
      'Zoom level: ' + zoom,
      'World Coordinate: ' + worldCoordinate,
      'Pixel Coordinate: ' + pixelCoordinate,
      'Tile Coordinate: ' + tileCoordinate
    ].join('<br>');
  }

  // The mapping between latitude, longitude and pixels is defined by the web
  // mercator projection.
  function project(latLng) {
    var siny = Math.sin(latLng.lat() * Math.PI / 180);

    // Truncating to 0.9999 effectively limits latitude to 89.189. This is
    // about a third of a tile past the edge of the world tile.
    siny = Math.min(Math.max(siny, -0.9999), 0.9999);

    return new google.maps.Point(
        TILE_SIZE * (0.5 + latLng.lng() / 360),
        TILE_SIZE * (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI)));
  }
window.onload = ()=>{
    document.getElementById("search").addEventListener('click', (event)=>setFilters(event,buildList));
    document.getElementById("submissions-list").addEventListener('click', (event)=>buildViewer(event));
    buildList();
};