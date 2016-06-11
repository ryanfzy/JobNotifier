/*
   variables with captial letters are constant variables, they are defined in constants.js
*/
var totalJobs = {};

var dataNames = [MERCYASCOT, ADHB];

var convertJobs = function(jobs){
    var convertedJobs = [];
    for (var i = 0; i < jobs.length; i++){
        var convertedJob = {};
        for (var j = 0; j < jobProperties.length; j++){
            var property = jobProperties[j];
            convertedJob[property] = jobs[i][property];
        }
        convertedJobs.push(convertedJob);
    }
    return convertedJobs;
};

var saveJobs = function(title, jobs){
    var jobs = convertJobs(jobs);
    jobscontrollerjs.setData(title, jobs);
    jobscontrollerjs.saveDataWhenReady();
};

var setJobProperty = function(category, index, key, value){
    totalJobs[category][index][key] = value;
    saveJobs(category, totalJobs[category]);
};

var removeJob = function(category, index){
    totalJobs[category].splice(index, 1);
    saveJobs(category, totalJobs[category]);
};

var jobModule = angular.module('JobNotifier', []);

// to load images to chrome extension, we must add the protocol 'chrome-extension'
// to the white list
jobModule.config(['$compileProvider', function ($compileProvider) {
    $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|chrome-extension):/);
}]);

jobModule.controller('MainController', ['$scope', function($scope){
    $scope.currentPanel = 'newjobs';
    $scope.jobs = [];

    /////////////////////////////////////////////////////////////////////////////
    // job view
    /////////////////////////////////////////////////////////////////////////////

    var cleanJobsView = function(){
        $scope.jobs = [];
    };

    $scope.showNewJobs = function(showFollowed){
        cleanDatabaseView();
        var displayJobs = [];
        for (var cat in totalJobs){
            var jobs = totalJobs[cat];
            commonjs.forEach(jobs, function(job){
                job.img = logos[job.source];
                if (job.isFollowed && showFollowed){
                    displayJobs.push(job);
                }
                else if (!job.isFollowed && !showFollowed){
                    displayJobs.push(job);
                }
            });
        }
        $scope.jobs = displayJobs;

        $scope.currentPanel = 'newjobs';
    };

    /////////////////////////////////////////////////////////////////////////////
    // data base view
    /////////////////////////////////////////////////////////////////////////////

    var cleanDatabaseView = function(){
        $scope.dataKeys = [];
        $scope.dataValues = [];
    };

    var loadDatabase = function(){
        /* tried to push an array in this array, each array represent a row in the table
           but failed because of no reason, $scope just cannot be assigned an array containing arrays
           (the truth is sometime it can, for example:
               $scope.dataKeys = ['a', 'b', 'c'];
               var a = ['1,5', '2', '3'];
               var b = ['', '3', '4'];
               var ab = [];
               $scope.dataValues[0] = a;
               $scope.dataValues[1] = b;
            this works fine) 
            therefore, in our case, we have to push an object {value: <some-value>} into this array
        */
        $scope.dataValues = [];
        $scope.dataKeys = [];
        var offset = 0;
        jobscontrollerjs.getDataForEach(dataNames, function(jobs, name){
            for (var j = 0; j < jobs.length; j++){
                idx = offset + j;
                $scope.dataValues[idx] = [];
                var job = jobs[j];
                for (var k = 0; k < $scope.dataKeys.length; k++){
                    var value = job[$scope.dataKeys[k]] || "";
                    $scope.dataValues[idx].push({value: value});
                }
                for (var prop in job){
                    if ($scope.dataKeys.indexOf(prop) === -1){
                        $scope.dataKeys.push(prop);
                        $scope.dataValues[idx].push({value:job[prop]});
                    }
                }
            }
            offset = jobs.length;

            if (name == dataNames[dataNames.length-1]){
                // this will give digest in progress error
                //$scope.$apply();
                $scope.$applyAsync();
            }
        });
    }

    $scope.viewDatabase = function(){
        cleanJobsView();
        loadDatabase();
        $scope.currentPanel = 'database';
    };

    $scope.deleteAllJobs = function(){
        jobscontrollerjs.deleteAll();
    };

    /////////////////////////////////////////////////////////////////////////////

    jobscontrollerjs.getDataForEach(dataNames, function(jobs, name){
        var subTotalJobs = [];
        commonjs.forEach(jobs, function(job, index){
            var updatedDate = new Date(job.updatedDate);
            var today = new Date();

            job.isNew = (updatedDate.getMonth() == today.getMonth() && updatedDate.getDate() == today.getDate());
            job.category = name;
            job.index = index;

            subTotalJobs.push(job);
        });
        /*
        for (var j = 0; j < jobs.length; j++){
            var job = jobs[j];
    
            // check if a job is a new job
            var updatedDate = new Date(job.updatedDate);
            var today = new Date();
            job.isNew = (updatedDate.getMonth() == today.getMonth() && updatedDate.getDate() == today.getDate());
            job.category = name;
            job.index = j;

            //job.isFollowed = job.isFollowed || false;

            subTotalJobs.push(job);
        }
        */

        // this is essential, otherwise some jobs will not show on the page
        totalJobs[name] = subTotalJobs;
    
        // show unfollowed jobs when all the data are loaded
        if (name == dataNames[dataNames.length-1]){
            $scope.showNewJobs(false);
        }
    });

    $scope.openUrl = function(job){
        chrome.tabs.create({url:job.href});
    };

    $scope.followJob = function(job){
        setJobProperty(job.category, job.index, 'isFollowed', true);
        $scope.showNewJobs(false);
    };

    $scope.unFollowJob = function(job){
        setJobProperty(job.category, job.index, 'isFollowed', false);
        $scope.showNewJobs(true);
    };

    $scope.showJson = function(job){
        commonjs.alertJson(job);
    };

    /////////////////////////////////////////////////////////////////////////////
    // for testing purpose
    $scope.removeJob = function(job){
        removeJob(job.category, job.index);
    };

    $scope.makeJobOld = function(job){
        var today = new Date();
        today.setDate(today.getDate()-1);
        setJobProperty(job.category, job.index, today.toDateString());
    };
    /////////////////////////////////////////////////////////////////////////////
    
}]);

jobModule.filter('NullFilter', function(){
    return function(str){
        if (str == null){
            return 'N/A';
        }
        return str;
    };
}).filter('TextLengthFilter', function(){
    return function(str){
        if (typeof str == 'string' && str.length > 30){
            return str.substr(0, 100) + '...';
        }
        return str;
    };
});

jobModule.directive('panel', function(){
    return {
        templateUrl: function(elem, attr){
            if (attr.type == 'database'){
                return 'dataview.html';
            }
            else if (attr.type == 'newjobs'){
                return 'jobview.html';
            }
        }
    }
});
