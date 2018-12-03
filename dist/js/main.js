const   defaultFilter = {
                        page: 1, 
                        pageSize: 10,
                        dateStart: "",
                        dateEnd: "",
                        address: "",
                        sortBy: "Date", 
                        sortVersus: -1
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

function buildList(filters=defaultFilter){
    loadJSON("Submission.json", function(response) {
        let submissions = JSON.parse(response);
            
        submissions = filterList(submissions, filters);
        loadJSON("SubmissionAnswer.json", function(response) {
            let answers = JSON.parse(response);
            submissions.forEach(function(submission) {
                let result = answers.filter(function(answer) {
                    return answer.SubmissionId === submission.SubmissionId;
                });
                submission.SubissionAnswers = (result !== undefined) ? result : null;
            });
            console.log(submissions);
            renderList(submissions);
        });
    });
}

function filterList(submissions={}, filters){
    let start = (filters.pageSize*filters.page)-(filters.pageSize),
        end = start + filters.pageSize;
    
    if(filters.dateStart !== ''){
        submissions = submissions.filter((submission)=>{
            let subDate = new Date(submission.Date.substr(0, 10)),
                startDate = new Date(filters.dateStart),
                endDate = filters.dateEnd === '' ? new Date(filters.dateStart) : new Date(filters.endDate);
            return subDate >= startDate && subDate <= endDate;
        });
    }
    if(filters.address !== ''){
        submissions = submissions.filter((submission)=>{
            return submission.Address.toLowerCase().includes(filters.address.toLowerCase());
        });
    }
    submissions.sort((a,b) => (a[filters.sortBy] > b[filters.sortBy]) ? filters.sortVersus : ((b[filters.sortBy] > a[filters.sortBy]) ? filters.sortVersus*(-1) : 0)); 
    renderPagination(submissions.length);
    
    submissions = submissions.slice(start,end);
    return submissions;
}

function renderList(submissions){
    let container = document.getElementById("submissions-list"),
        html = "<table>";
    loadJSON("Question.json", function(response) {
        let questions = JSON.parse(response);
        submissions.forEach((submission)=>{
            let answersList = '';
            submission.SubissionAnswers.forEach((answer)=>{
                let result = questions.filter(function(question) {
                    return question.QuestionId === answer.QuestionId;
                });
                answer.QuestionText = (result[0] !== undefined) ? result[0].Text : null;
                answersList += `<li>${answer.QuestionText}: ${answer.Text}</li>`;
            });
            html += `<tr>
                        <td>${submission.SubmissionId}</td>
                        <td>${formatDate(submission.Date)}</td>
                        <td>${submission.Address}</td>
                        <td>${submission.Latitude} ${submission.Longitude}</td>
                        <td><ul>${answersList}</ul></td>
                    </tr>`
        });
        html += "<table>";
        container.innerHTML = html;
    });
    
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

function setFilters(event){
    let startDate = document.getElementsByName("searchDate")[0],
        endDate = document.getElementsByName("searchDateEnd")[0],
        address = document.getElementsByName("searchAddress")[0],
        dateValidator = /^(?:(?:31(\/|-|\.)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/|-|\.)(?:0?[1,3-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/|-|\.)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/|-|\.)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/,
        addressValidator = /^[a-zA-Z.,;:?ùàòè ]{3,100}$/;
    
    if(dateValidator.test(formatDate(startDate.value))){
        defaultFilter.dateStart = formatDate(startDate.value,false,true);
    }
    if(dateValidator.test(formatDate(endDate.value))){
        defaultFilter.dateEnd = formatDate(endDate.value,false,true);
    }
    if(addressValidator.test(address.value)){
        defaultFilter.address = address.value;
    }

    buildList();
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
        pageCount = Math.ceil(count/defaultFilter.pageSize),
        html = '<ul>';
        
    for(let i=1; i<=pageCount; i++){
        html += `<li><button type="button" data-page="${i}">${i}</button></li>`;
    }
    html += '</ul>';
    container.innerHTML = html;
    container.addEventListener('click', (event)=>eventWrapper(event,(event)=>{
        let goTo = event.target.getAttribute("data-page");
        if(goTo !== defaultFilter.page){
            defaultFilter.page = goTo;
            buildList();
        }
        
    }), false);
}

window.onload = ()=>{
    document.getElementById("search").addEventListener('click', (event)=>setFilters(event));
    buildList();
};