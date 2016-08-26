/* libs used
   Common.js
*/

var Assert = function(cond, message){
    if (!cond){
        console.log('ERROR: ' + message);
    }
};

var decode = function(data){
    var res = decodeURIComponent(data);
    res = res.replace(/&amp;/g, '&');
    res = res.replace(/\\/g, '');
    return res;
};

//////////////////////////////////////////////////////////////////////////

/*
   go to constants.js to see the data structure defintion for jobs
*/

// global variables
var gJobs = {};
var gJobCmpFuncs = {};
var gNumOfNewJobs = 0;
var gUrls = {};
var loader = new UrlLoader();

var supportedSources = [MERCYASCOT, ADHB, WDHB];
//var supportedSources = [MERCYASCOT];

var _createNewJob = function(oldJob){
    var newJob = {};

    newJob[HREF] = oldJob[HREF] || "";
    newJob[TITLE] = oldJob[TITLE] || "";
    newJob[DESCRIPTION] = oldJob[DESCRIPTION] || "";
    newJob[LOCATION] = oldJob[LOCATION] || "";
    newJob[EXPERTISE] = oldJob[EXPERTISE] || "";
    newJob[WORKTYPE] = oldJob[WORKTYPE] || "";
    newJob[LEVEL] = oldJob[LEVEL] || "";
    newJob[POSTEDDATE] = oldJob[POSTEDDATE] || "";
    newJob[CLOSEDATE] = oldJob[CLOSEDATE] || "";
    newJob[UPDATEDDATE] = oldJob[UPDATEDDATE] || (new Date()).toDateString();
    newJob[SOURCE] = oldJob[SOURCE] || "";
    //newJob[DATAVERSION] = DATA_VERSION;

    newJob[ISFOLLOWED] = oldJob[ISFOLLOWED] || false;
    newJob[STATUS] = oldJob[STATUS] || JobStatus.New;

    return newJob;
};

// this create a new job
var CreateNewJob = function(){
    var newJob = _createNewJob({});
    return newJob;
    /*
    var newJob = {};

    newJob[HREF] = "";
    newJob[TITLE] = "";
    newJob[DESCRIPTION] = "";
    newJob[LOCATION] = "";
    newJob[EXPERTISE] = "";
    newJob[WORKTYPE] = "";
    newJob[LEVEL] = "";
    newJob[POSTEDDATE] = "";
    newJob[CLOSEDATE] = "";
    newJob[UPDATEDDATE] = (new Date()).toDateString();
    newJob[SOURCE] = "";
    //newJob[DATAVERSION] = DATA_VERSION;

    newJob[ISFOLLOWED] = false;
    newJob[STATUS] = JobStatus.New;

    return newJob;
    */
}

var CreateNewJobFromExistingJob = function(oldJob){
    var newJob = _createNewJob(oldJob);
    return newJob;
};

var AreTwoJobsSameForAttributes = function(job1, job2, attributes){
    for (var i = 0; i < attributes.length; i++){
        var attribute = attributes[i];
        if (job1[attribute] != job2[attribute]){
            return false;
        }
    }
    return true;
};

// this function update the job
var UpdateJob = function(oldJob, newJob){
    // here are only job keys, not user data keys
    var attributes = [HREF, TITLE, DESCRIPTION, LOCATION, EXPERTISE, WORKTYPE, LEVEL,
        POSTEDDATE, CLOSEDATE, SOURCE];

    if (!AreTwoJobsSameForAttributes(oldJob, newJob, attributes)){
        for (var i = 0; i < attributes.length; i++){
            oldJob[attributes[i]] = newJob[attributes[i]];
        }

        oldJob[STATUS] = JobStatus.Updated;
        oldJob[UPDATEDDATE] = newJob[UPDATEDDATE];
    }
    else{
        oldJob[STATUS] = JobStatus.Old;
    }

    // don't update isFollowed field
    //oldJob[ISFOLLOWED] = newJob[ISFOLLOWED];

    return oldJob;
}

// update old jobs and add new jobs
// jobs from old jobs that are no longer exist will be removed unless it is followed
var GetUpdatedJobs = function(title, newJobs, oldJobs){
    // get the corresponding compare function
    var cmpfunc = gJobCmpFuncs[title];
    var jobs = [];

    // get new jobs
    commonjs.forEach(newJobs, function(newJob){
        var jobToAdd = newJob;
        // if we find the same job in old jobs, update the job
        commonjs.forEachTrue(oldJobs, newJob, cmpfunc, function(oldJob){
            jobToAdd = UpdateJob(oldJob, newJob);
        });

        // if we can't find the same job, add the new job
        jobs.push(jobToAdd);
    });

    var diff = commonjs.getDiffFrom2ArrayEx(oldJobs, jobs, function(job1, job2){
        return job1[HREF] == job2[HREF];
    });

    // find outdated jobs and check if any of them are followed
    // if find any, add them back and mark them as outdated
    commonjs.forEach(diff, function(job){
        if (job[ISFOLLOWED]){
            console.log('find closed job');
            console.log(job);
            job[STATUS] = JobStatus.Closed;
            jobs.push(job);
        }
    });

    return jobs;
};

// save the new jobs to local storage
var SaveNewJobsToLocal = function(){

    Assert(Object.keys(gJobs).length == supportedSources.length, 'ERROR: SaveNewJobsToLocal() gJobs and supportedSources should have same number of items');

    var titles = Object.keys(gJobs);

    jobscontrollerjs.getDataForEach(titles, function(oldJobs, title){
        //console.log('old jobs');
        //console.log(oldJobs);

        // update old jobs and add new jobs
        gJobs[title] = GetUpdatedJobs(title, gJobs[title], oldJobs);

        // find out the number of new jobs and displays it
        for (var i = 0; i < gJobs[title].length; i++){
            if (gJobs[title][i][STATUS] == JobStatus.New){
                gNumOfNewJobs++;
            }
        }
        if (gNumOfNewJobs > 0){
            chrome.browserAction.setBadgeText({text: gNumOfNewJobs.toString()});
        }
        else {
            chrome.browserAction.setBadgeText({text: ''});
        }

        console.log('new jobs');
        console.log(gJobs[title]);

        jobscontrollerjs.setData(title, gJobs[title]);
    });

    jobscontrollerjs.saveDataWhenReady();
};

var SaveNewJobs = function(title, jobs, cmpfunc){
    gJobs[title] = jobs;
    gJobCmpFuncs[title] = cmpfunc;
    
    // save the data when we have fetch all the data from web
    // we tell this by testing is title the last source in the supported source list
    if (title == supportedSources[supportedSources.length-1]){
        SaveNewJobsToLocal();
    }
}

//////////////////////////////////////////////////////////////////////////

gUrls[MERCYASCOT] = 'https://careers.mercyascot.co.nz/home';

var parseMercyAscot = function(data){

    Assert(typeof data == 'string', 'parseMercyAscot: data (arg) is not string');
    Assert(data.length > 0, 'parseMercyAscot: data (arg) is empty string');

    var parser = parserjs.CreateParser(data);
    //var job = {};
    var job = CreateNewJob();

    parser.Find('div[class=title] a').Parse(function(html, attrs, data){
        job[HREF] = 'https://careers.mercyascot.co.nz/' + attrs['href'];
    });
    
    parser.Find('div[class=title] a span').Parse(function(html, attrs, data){
        job[TITLE] = html;
    });
    
    parser.Find('div[class=description]').Parse(function(html, attrs, data){
        job[DESCRIPTION] = html;
    });
    
    var jobDetails = [];
    parser.Find('span[class=detail-item]').Parse(function(html, attrs, data){
        var tmp = data.split('</span>');
        jobDetails.push(tmp[tmp.length-2]);
    });

    var detailProperties = [LOCATION, EXPERTISE, WORKTYPE, LEVEL,
        POSTEDDATE, CLOSEDATE];

    commonjs.forEach(detailProperties, function(property, index){
        job[property] = jobDetails[index];
    });

    job[SOURCE] = MERCYASCOT;

    return job;
};

var mercyascotCmpFunc = function(item1, item2){

    Assert((typeof item1 == 'object' || typeof item2 == 'object'), 'mercyascotCmpFunc: either item1 (arg) or item (arg) is not object');

    // if item1 and item2 has the same title, post date and close date
    // they are the same job, otherwise they are different jobs
    var properties = [TITLE, POSTEDDATE, CLOSEDATE];

    for (var i = 0; i < properties.length; i++){
        var propName = properties[i];
        if (item1[propName] != item2[propName]){
            return false;
        }
    }
    return true;
};

//////////////////////////////////////////////////////////////////////////

gUrls[ADHB] = 'http://careers.adhb.govt.nz/JobSearch/tabid/61/Default.aspx';

var parseAdhb = function(data){

    Assert(typeof data == 'string', 'parseAdhb: data (arg) is not string');
    Assert(data.length > 0, 'parseAdhb: data (arg) is empty string');

    parser = parserjs.CreateParser(data);
    var jobs = [];
    parser.Find('input[name=initialHistory]').Parse(function(html, attrs, data){
        var raw = attrs.value.split('!|!');
        var goodData = [];
        var numOfJobsFound = 0;

        // filter out meaningless data
        for (var i = 0; i < raw.length; i++){
            var item = raw[i];
            if (item.length > 0 && !/^\d+$/.test(item)
                && item !== 'true' && item !== 'false'
                && !/^ftl/.test(item) && !/^jobsearch/.test(item)
                && !/^list/.test(item) && !/^rl/.test(item)
                && !/[aA]pply/.test(item) && !/^Add/.test(item)
                && !/^Submission/.test(item)){
                if (/^Search Result/.test(item)){
                    numOfJobsFound = parseInt(item.substr(16, 2));
                }
                goodData.push(decode(item));
            }
        }

        // due some changes on adhb website on 11st July 2016
        // each job might not always occupy 11 elements
        // so we need to do some extra works
        var offset = 12;
        for (var i = 0; i < numOfJobsFound; i++){
            var idx = i * offset;

            // before we extract the data, we first check if the 8th element is a href
            // if not, insert an empty element at 8th position, so each job always occupy 11 elements
            if (goodData[idx+8].indexOf('http') == 0){
                goodData.splice(idx+8, 0, '');
            }
            // same reason as above for the 2nd element
            if (goodData[idx+2].indexOf('CEN') == -1){
                goodData.splice(idx+2, 0, '');
            }

            var job = CreateNewJob();
            job[HREF] = goodData[idx+10];
            job[TITLE] = goodData[idx];
            job[DESCRIPTION] = goodData[idx+1];
            job[LOCATION] = goodData[idx+7] + ', ' + goodData[idx+6];
            job[EXPERTISE] = goodData[idx+5];
            job[WORKTYPE] = goodData[idx+8] + '(' + goodData[idx+9] + ')';
            job[LEVEL] = job[EXPERTISE];
            job[POSTEDDATE] = goodData[idx+3];
            job[CLOSEDATE] = goodData[idx+4];

            job[SOURCE] = ADHB;
            jobs.push(job);
        }
    });

    return jobs;
};

var UpdateWorkTypeForAdhbJobsThenSave = function(jobs){
    // we have to use this variable, otherwise we have no way to know when
    // the loader finish (evil of asyn function)
    var jobsDone = 0;

    commonjs.forEach(jobs, function(job){
        // find out if the job is fixed term or permanent
        if (job[WORKTYPE].toLowerCase().indexOf('fixed') == -1
            || job[WORKTYPE].toLowerCase().indexOf('permanent') == -1){

            loader.load(job[HREF], function(text){
                var type = ''
                if (text.toLowerCase().indexOf('fixed') > -1){
                    type = 'Fixed Term, ';
                }
                else if (text.toLowerCase().indexOf('permanent') > -1){
                    type = 'Permanent, ';
                }
                if (type.length > 0){
                    job[WORKTYPE] = type + job[WORKTYPE];
                }
                jobsDone++;

                // when all the jobs have been looked at, then save them
                if (jobsDone == jobs.length){
                    SaveNewJobs(ADHB, jobs, adhbCmpFunc);
                }
            });
        }
    });
};

var adhbCmpFunc = function(item1, item2){
    Assert((typeof item1 == 'object' || typeof item2 == 'object'), 'adhbCmpFunc: either item1 (arg) or item (arg) is not object');
    return mercyascotCmpFunc(item1, item2);
};

//////////////////////////////////////////////////////////////////////////

gUrls[WDHB] = "http://wdhbcareers.co.nz/listings.php?jobNum=&keyWords=&parentCats=200000040&subCats=200000063"

var parseWdhb = function(html){
    var wdhb = "http://wdhbcareers.co.nz";

    var job = CreateNewJob();
    var parser = parserjs.CreateParser(html);
    
    // get the href
    parser.Find('a').Index(0).Parse(function(html, attrs, data){
        job[HREF] = wdhb + attrs['href'];
        job[TITLE] = html;
    });

    // get the posted date
    var jobPosted = 'job posted:';
    var startIndexOfPostedDate = html.toLowerCase().indexOf(jobPosted);
    if (startIndexOfPostedDate > -1){
       var subStr = html.substr(startIndexOfPostedDate); 
       var endIndexOfPostedDate = subStr.toLowerCase().indexOf('<div');

       // get the start and end index of the posted date
       endIndexOfPostedDate = startIndexOfPostedDate + endIndexOfPostedDate;
       startIndexOfPostedDate = startIndexOfPostedDate + jobPosted.length;

       var postedDate = html.substring(startIndexOfPostedDate, endIndexOfPostedDate).trim();

       job[POSTEDDATE] = postedDate;
       job[SOURCE] = WDHB;
    }

    return job;
};

var updateMoreJobInfoThenSave = function(jobs){
    var jobsDone = 0;
    commonjs.forEach(jobs, function(job){
        loader.load(job[HREF], function(html){
            // replace the new line characters with a space
            html = html.replace(/(\r|\n|\r\n)/gi, ' ');

            //get the closing date
            var jobClose = 'closing date:';
            var startIndexOfCloseDate = html.toLowerCase().search(jobClose);
            if (startIndexOfCloseDate > -1){
                var subStr = html.substr(startIndexOfCloseDate);
                var endIndexOfCloseDate = subStr.indexOf('<');

                // get the start and end index of the close date
                endIndexOfCloseDate = endIndexOfCloseDate + startIndexOfCloseDate;
                startIndexOfCloseDate = startIndexOfCloseDate + jobClose.length;

                var closeDate = html.substring(startIndexOfCloseDate, endIndexOfCloseDate).trim().replace(/\s+/, ' ');
                job[CLOSEDATE] = closeDate;
            }

            //check if the job is permanent or fixed term
            var type = '';
            if (html.toLowerCase().indexOf('fixed') > -1){
                type = 'Fixed term, ';
            }
            else if (html.toLowerCase().indexOf('permanent')){
                type = 'permanent, ';
            }
            var parser = parserjs.CreateParser(html).Find('table[class=jobdetails] td');
            parser.Index(1).Parse(function(html, attrs, data){
                type += html.trim();
            });
            parser.Index(3).Parse(function(html, attrs, data){
                type = type + ', ' + html.trim();
            });

            job[WORKTYPE] = type;

            jobsDone++;
            if (jobsDone == jobs.length){
                SaveNewJobs(WDHB, jobs, adhbCmpFunc);
            }
        });
    });
};

//////////////////////////////////////////////////////////////////////////

var FetchNewJobsFromSources = function(){
    
    chrome.browserAction.setBadgeText({text: 'load'});
	
	// thread issue with chrome.storage
	loader.load(gUrls[MERCYASCOT], function(text){
	
	    Assert(text.length > 0, 'ERROR: load for mercyasoct url return empty string');
	
	    var parser = parserjs.CreateParser(text);
	    var newJobs = [];
	    parser.Find('div[class=job]').Parse(function(html, attrs, data){
	        var job = parseMercyAscot(html);
	        newJobs.push(job);
	    });
	
	    Assert(newJobs.length > 0, 'ERROR: parse mercyascot website return empty jobs');
	
	    SaveNewJobs(MERCYASCOT, newJobs, mercyascotCmpFunc);
	});

    /*
    var queryMercyAscot = "from 'https://careers.mercyascot.co.nz/home'\n" +
            "select 'div[class=job]' as rets\n" +
            "where-each as ret\n" +
            "from ret.html\n" +
            "select 'div[class=title] a' as href\n" +
            "add-field href.attrs.href for-key '" + HREF + "'\n" +
            "and\n" +
            "from ret.html\n" +
            "select 'div[class=title] a span' as title\n" +
            "add-field title.html for-key '" + TITLE + "'\n" +
            "and\n" +
            "from ret.html\n" +
            "select 'div[class=description]' as description\n" +
            "add-field description.html for-key '" + DESCRIPTION + "'\n" +
            "and\n" +
            "from ret.html\n" +

            "select 'span[class=detail-item]' as [" + LOCATION + ', ' + EXPERTISE + ', ' + WORKTYPE + ', ' + LEVEL + ', ' + POSTEDDATE + ', ' + CLOSEDATE + "]\n" +
            "where-each as detail\n" +
            "add-field detail.html for-key detail.$Name;";

    var jobs = [];
    queryparserjs.InterpretEx(queryMercyAscot, 
            {
                forEach : function(ret){
                    var properties = [LOCATION, EXPERTISE, WORKTYPE, LEVEL,
                        POSTEDDATE, CLOSEDATE];

                    commonjs.forEach(properties, function(property){
                        var data = ret[property].split('</span>');
                        ret[property] = data[data.length-1];
                    });

                    ret[HREF] = 'https://careers.mercyascot.co.nz/' + ret[HREF];
                    ret[SOURCE] = MERCYASCOT;

                    var job = CreateNewJobFromExistingJob(ret);
                    jobs.push(job);
                },
                whenAllFinish : function(){
	                SaveNewJobs(MERCYASCOT, jobs, mercyascotCmpFunc);
                }
            }
    );

    var adhbQuery = "from 'https://adhbrac.taleo.net/careersection/adhb_clinical/jobsearch.ftl?lang=en&amp;jobfield=200000063&dropListSize=100#mainContent'\n" +
                    "select 'input[name=initialHistory]' as raw\n" +
                    "add-field raw.attrs.value for-key 'rawOutput';"

    queryparserjs.Interpret(adhbQuery, function(rets){
            console.log('here');
            console.log(rets);
        //var newJobs = parseAdhb(rets[0].rawOutput);
        //UpdateWorkTypeForAdhbJobsThenSave(newJobs);
    });*/
	
	loader.load(gUrls[ADHB], function(text){
	
	    Assert(text.length > 0, 'ERROR: load for adhb url return empty string');
	
	    var parser = parserjs.CreateParser(text);
	    parser.Find('iframe').Parse(function(html, attrs, data){
	        //decode the url
	        var src = decode(attrs.src);
	       
	        // show 100 jobs in a page 
	        src = src.substring(0, src.lastIndexOf('#')) + '&dropListSize=100';
	
	        loader.load(src, function(text){
	
	           Assert(text.length > 0, 'ERROR: load for adhb url 2 return empty string');
	
	           var newJobs = parseAdhb(text);
	
	           Assert(newJobs.length > 0, 'ERROR: parse adhb website return empty jobs');
	
	           UpdateWorkTypeForAdhbJobsThenSave(newJobs);
	        });
	    });
	});

    loader.load(gUrls[WDHB], function(text){
        Assert(text.length > 0, 'ERROR: load for wdhb url return empty string');

        var jobs = [];
        var parser = parserjs.CreateParser(text);
        parser.Find('div[id=page_container] div[class=listing]').Parse(function(html, attrs, data){
            var job = parseWdhb(html);
            jobs.push(job);
        });

        updateMoreJobInfoThenSave(jobs);
    });
}

//jobscontrollerjs.deleteAll();

FetchNewJobsFromSources();

//chrome.browserAction.setBadgeText({text: '10'});

//////////////////////////////////////////////////////////////////////////

function getTestData(){
    var today = new Date();
    var job1 = {};
    job1['title'] = 'job1';
    job1['updatedDate'] = today.toDateString();
    alertJson(job1);

    var job2 = {};
    job2['title'] = 'job2';
    //today.setMonth(8);
    job2['updatedDate'] = today.toDateString();
    alertJson(job2);

    return [job1, job2];
};
