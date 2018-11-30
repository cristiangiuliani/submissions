const   defaultFilter = {
                        page: 1, 
                        pageSize: 10,
                        columns: [
                            //{name: "Date", start: "", end: ""}
                        ],
                        sortBy: "Date", 
                        sortVersus: 1
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
        let submissions = JSON.parse(response),
            submissionsSubSet = filterList(submissions, filters);
        loadJSON("SubmissionAnswer.json", function(response) {
            let answers = JSON.parse(response);
            submissionsSubSet.forEach(function(submission) {
                let result = answers.filter(function(answer) {
                    return answer.SubmissionId === submission.SubmissionId;
                });
                submission.SubissionAnswers = (result !== undefined) ? result : null;
            });
            console.log(submissionsSubSet);
            renderList(submissionsSubSet);
        });
    });
}

function filterList(submissions={}, filters){
    let start = filters.pageSize-(filters.pageSize*filters.page);
    submissions.sort((a,b) => (a[filters.sortBy] > b[filters.sortBy]) ? filters.sortVersus : ((b[filters.sortBy] > a[filters.sortBy]) ? filters.sortVersus*(-1) : 0)); 
    submissions = submissions.slice(start,filters.pageSize);
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
                        <td>${submission.Date}</td>
                        <td>${submission.Address}</td>
                        <td>${submission.Latitude} ${submission.Longitude}</td>
                        <td><ul>${answersList}</ul></td>
                    </tr>`
        });
        html += "<table>";
        container.innerHTML = html;
    });
    
}

window.onload = ()=>{
    buildList();
};