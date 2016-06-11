// this is a helper function
// it simply the logic to load/save data from/to chrome storage
var jobscontrollerjs = (function(){

    var State = {
        NotLoaded : 1,
        Loaded : 2,
        Loading : 3,
    };

    var currentState = State.NotLoaded;
    var JobNotifier = 'JobNotifier';

    // load data from chrome storage to here
    var JobNotifierData = {};
    JobNotifierData[JobNotifier] = {};

    var getDataFuncs = {};
    var setSaveData = false;

    // check if data loaded from chrome
    var isDataLoaded = function(){
        return currentState == State.Loaded;
    };

    // set 'jobs' for 'title'
    var setData = function(title, jobs){
        //alert('saveData');
        JobNotifierData[JobNotifier][title] = jobs;
        //chrome.storage.local.set(JobNotifierData);
    };

    // trigger the data to be saved in chrome
    var saveDataWhenReady = function(){
        //alert('saveData2');
        setSaveData = true;
        if (isDataLoaded()){
            setSaveData = false;
            chrome.storage.local.set(JobNotifierData);
        }
    };

    var addGetDataFn = function(title, fn){
        getDataFuncs[title] = getDataFuncs[title] || [];
        getDataFuncs[title].push(fn);
    };

    // async call
    // get the jobs for each title
    var getDataForEach = function(titles, func){
        if(typeof titles == 'string'){
            titles = [titles];
        }

        // we take different action depends on different/current states
        switch (currentState){
            // load the data if data has never been loaded
            case State.NotLoaded:
                currentState = State.Loading;
                //getDataFuncs[title] = func;
                for (var tIdx = 0; tIdx < titles.length; tIdx++){
                    addGetDataFn(titles[tIdx], func);
                }

                var jobNotifierDefault = {};
                jobNotifierDefault[JobNotifier] = null;

                chrome.storage.local.get(jobNotifierDefault, function(data){
                    currentState = State.Loaded;
                    if (data[JobNotifier]){
                        JobNotifierData = data;
                    }
                    for (var title in getDataFuncs){
                        var fns = getDataFuncs[title];
                        var jobs = JobNotifierData[JobNotifier][title] || [];
                        for (var i = 0; i < fns.length; i++){
                            fns[i](jobs, title);
                        }
                    }
                    getDataFuncs = {};
                    if (setSaveData){
                        saveDataWhenReady();
                    }
                });
                break;

            // if we are still loading, we simple add the callback and wait
            case State.Loading:
                for (var tIdx = 0; tIdx < titles.length; tIdx++){
                    addGetDataFn(titles[tIdx], func);
                }
                break;

            // if data already be loaded, we read the data from memory
            case State.Loaded:
                for (var tIdx = 0; tIdx < titles.length; tIdx++){
                    var title = titles[tIdx];
                    var jobs = JobNotifierData[JobNotifier][title] || [];
                    func(jobs, title);
                }
                break;

            default:
                break;
        }
    };

    // delete the data from chrome
    var deleteAll = function(){
        var emptyJobNotifier = {};
        emptyJobNotifier[JobNotifier] = {};
        chrome.storage.local.set(emptyJobNotifier);
    };

    return {
        setData : setData,
        getDataForEach : getDataForEach,
        saveDataWhenReady : saveDataWhenReady,
        deleteAll : deleteAll,
    };
})();
//alert('jobscontrollerjs');
