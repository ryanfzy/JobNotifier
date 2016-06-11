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

var alertJson = function(data){
    alert(JSON.stringify(data, null, 4));
};

var alertEx = function(data){
    var titles = ""; 
    for (var i = 0; i < data.length; i++){
        titles += (data[i]['title'] + ';');
    }
    alert(titles);
};

var addProperties = function(obj, propertyNames, propertyValues, defaultValue){
    for (var i = 0; i < propertyNames.length; i++){
        var name = propertyNames[i];
        var value = defaultValue;
        if (propertyValues.length > i){
            value = propertyValues[i];
        }
        obj[name] = value;
    }
    return obj;
};

//////////////////////////////////////////////////////////////////////////

// every time we chage the data structure, increase the version number by 1
var DATA_VERSION = '1';

// compare functon should return one of of following result
var CompareResult = {};
CompareResult.Equal = 0;
CompareResult.NotEqual = 1;
CompareResult.EqualWithHigherVersion = 2;
CompareResult.EqualWithLowerVersion = 3;

// job sources
var MERCYASCOT = 'mercyascot';
var ADHB = 'adhb';

// job data keys
var HREF = 'href';
var TITLE = 'title';
var DESCRIPTION = 'description';
var LOCATION = 'location';
var EXPERTISE = 'expertise';
var WORKTYPE = 'workType';
var LEVEL = 'level';
var POSTEDDATE = 'postedDate';
var CLOSEDATE = 'closeDate';
var UPDATEDDATE = 'updatedDate';
var SOURCE = 'source';
var DATAVERSION = 'dataVersion';
var USERDATA = 'userData';

// user data keys
var ISFOLLOWED = 'isFollowed';

// global variables
var gJobs = {};
var gJobCmpFuncs = {};
var gNumOfNewJobs = 0;
var gUrls = {};

var supportedSources = [MERCYASCOT, ADHB];

var CreateNewUserData = function(){
    var userData = {};
    userData[ISFOLLOWED] = false;
}

// this create a new job
var CreateNewJob = function(){
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
    //newJob[ISFOLLOWED] = false;
    newJob[UPDATEDDATE] = (new Date()).toDateString();
    newJob[SOURCE] = "";
    newJob[DATAVERSION] = DATA_VERSION;

    newJob[USERDATA] = CreateNewUserData();

    return newJob;
}

// create a new job object
// TODO: this function should only update the job
var UpdateOldJob = function(jobPart){
    var newJob = {};

    newJob[HREF] = jobPart[HREF] || "";
    newJob[TITLE] = jobPart[TITLE] || "";
    newJob[DESCRIPTION] = jobPart[DESCRIPTION] || "";
    newJob[LOCATION] = jobPart[LOCATION] || "";
    newJob[EXPERTISE] = jobPart[EXPERTISE] || "";
    newJob[WORKTYPE] = jobPart[WORKTYPE] || "";
    newJob[LEVEL] = jobPart[LEVEL] || "";
    newJob[POSTEDDATE] = jobPart[POSTEDDATE] || "";
    newJob[CLOSEDATE] = jobPart[CLOSEDATE] || "";
    //newJob[ISFOLLOWED] = jobPart[ISFOLLOWED] || false;
    newJob[UPDATEDDATE] = jobPart[UPDATEDDATE] || (new Date()).toDateString();
    newJob[SOURCE] = jobPart[SOURCE] || "";
    newJob[DATAVERSION] = jobPart[DATAVERSION] || "0";

    newJob[USERDATA] = jobPart[USERDATA] || CreateNewUserData();

    return newJob;
}

// return all the jobs including old ones and new ones
var GetUpdatedJobs = function(title, newJobs, oldJobs){
    var cmpfunc = gJobCmpFuncs[title];
    var jobs = [];
    //var allJobs = [];

    //var indexesOfOldJobsToRemove = [];
    //var updatedOldJobs = [];
    //commonjs.forEach(oldJobs, function(oldJob){
        //updatedOldJobs.push(UpdateOldJob(oldJobs));
    //});

    // get new jobs
    commonjs.forEach(newJobs, function(newJob){
        if (!commonjs.anyTrue(oldJobs, newJob, cmpfunc)){
            jobs.push(newJob);
            gNumOfNewJobs++;
        }
        /*
        var result = CompareResult.NotEqual;
        commonjs.forEach(oldJobs, function(oldJob, index, ret){
           oldJob = UpdateOldJob(oldJob);
           var result = cmpfunc(oldJob, newJob);
           switch (result){
           case CompareResult.Equal:
               result = CompareResult.Equal;
               ret.break = true;
               break;
           case CompareResult.EqualWithHigherVersion:
               allJobs.push(newJob);
               break;
           case CompareResult.EqualWithLowerVersion:
               allJobs.push(oldJob);
               break;
           default:
               break;
           }
           result.break = true;
       }); 
       */
    });

    // append new jobs to old jobs
    //jobs = oldJobs.concat(jobs);
    return jobs;
};

var SaveNewJobsToLocal = function(){

    Assert(Object.keys(gJobs).length == supportedSources.length, 'ERROR: SaveNewJobsToLocal() gJobs and supportedSources should have same number of items');

    var titles = Object.keys(gJobs);
    // change the function name from getData to getDataForEach
    jobscontrollerjs.getDataForEach(titles, function(oldJobs, title){
        //console.log('old jobs');
        //console.log(oldJobs);
        gJobs[title] = GetUpdatedJobs(title, gJobs[title], oldJobs);
        console.log('new jobs');
        console.log(gJobs[title]);

        // bad name
        jobscontrollerjs.setData(title, gJobs[title]);
    });
    // bad name
    jobscontrollerjs.saveDataWhenReady();
};

// add some more info to a job object
/*
var addMoreInfo = function(job){
    var today = new Date();
    job[UPDATEDDATE] = today.toDateString();
    job[ISFOLLOWED] = false;
    return job;
};*/

var SaveNewJobs = function(title, jobs, cmpfunc){
    // add some more info to each job
    /*
    for (var i = 0; i < jobs.length; i++){
        //jobs[i] = addMoreInfo(jobs[i]);
        jobs[i] = createNewJob(jobs[i]);
    }*/

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

    var job = addProperties(job, detailProperties, jobDetails, null);

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
            //return CompareResult.NotEqual;
        }
    }
    return true;

    /*
    // item1 and item2 are the same job, but they have different data version number
    if (item1[DATAVERSION] > item2[DATAVERSION]){
        return CompareResult.EqualWithLowerVersion;
    }
    else if (item1[DATAVERSION] < item2[DATAVERSION]){
        return CompareResult.EqualWithHigherVersion;
    }

    // item1 and item2 are the same job with same data version number
    return CompareResult.Equal;
    */
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

        var offset = 11;
        for (var i = 0; i < numOfJobsFound; i++){
            var idx = i * offset;

            var job = CreateNewJob();
            job[HREF] = goodData[idx+9];
            job[TITLE] = goodData[idx];
            job[DESCRIPTION] = goodData[idx+1];
            job[LOCATION] = goodData[idx+6] + ', ' + goodData[idx+5];
            job[EXPERTISE] = goodData[idx+4];
            job[WORKTYPE] = goodData[idx+7] + '(' + goodData[idx+8] + ')';
            job[LEVEL] = job[EXPERTISE];
            job[POSTEDDATE] = goodData[idx+2];
            job[CLOSEDATE] = goodData[idx+3];

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

var FetchNewJobsFromSources = function(){
	
	// thread issue with chrome.storage
	var loader = new UrlLoader();
	loader.load(gUrls[MERCYASCOT], function(text){
	
	    Assert(text.length > 0, 'ERROR: load for mercyasoct url return empty string');
	
	    var parser = parserjs.CreateParser(text);
	    var newJobs = [];
	    parser.Find('div[class=job]').Parse(function(html, attrs, data){
	        var job = parseMercyAscot(html);
	        newJobs.push(job);
	    });
	
	    Assert(newJobs.length > 0, 'ERROR: parse mercyascot website return empty jobs');
	
	    //var newJobs = getTestData();
	    SaveNewJobs(MERCYASCOT, newJobs, mercyascotCmpFunc);
	});
	
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
}

jobscontrollerjs.loadData(function(){
    if (jobscontrollerjs.getMetaData(DATAVERSION) < DATA_VERSION){
        UpgradeOldData(jobscontrollerjs.getAllJobs());
    }
    FetchNewJobs();
});


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
