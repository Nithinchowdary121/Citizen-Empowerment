(function(){
  const app = angular.module('cvApp', ['ngRoute']);
  const API = '';

  app.config(function($routeProvider, $locationProvider){
    $routeProvider
      .when('/', { templateUrl: 'views/home.html', controller: 'HomeCtrl' })
      .when('/submit', { templateUrl: 'views/submit.html', controller: 'SubmitCtrl' })
      .when('/surveys', { templateUrl: 'views/surveys.html', controller: 'SurveysCtrl' })
      .when('/mine', { templateUrl: 'views/mine.html', controller: 'MineCtrl' })
      .when('/admin', { templateUrl: 'views/admin.html', controller: 'AdminCtrl' })
      .otherwise('/');
    $locationProvider.hashPrefix('');
  });

  // Services
  app.factory('Api', function($http){
    return {
      listFeedback: (params={}) => $http.get(API + '/api/feedback', { params }).then(r=>r.data),
      createFeedback: (payload) => $http.post(API + '/api/feedback', payload).then(r=>r.data),
      updateStatus: (id, status) => $http.patch(API + '/api/feedback/'+id+'/status', { status }).then(r=>r.data),
      reports: () => $http.get(API + '/api/reports/summary').then(r=>r.data),
      listSurveys: () => $http.get(API + '/api/surveys').then(r=>r.data),
      createSurvey: (payload) => $http.post(API + '/api/surveys', payload).then(r=>r.data),
      respondSurvey: (id, payload) => $http.post(API + '/api/surveys/'+id+'/responses', payload).then(r=>r.data)
    };
  });

  // Controllers
  app.controller('HomeCtrl', function($scope, Api){
    $scope.metrics = null;
    Api.reports().then(data=>{ $scope.metrics = data; });
  });

  app.controller('SubmitCtrl', function($scope, Api){
    $scope.form = { title:'', description:'', category:'other', userEmail:'' };
    $scope.submitted = false;
    $scope.submit = function(){
      if(!$scope.form.title || !$scope.form.description) return;
      Api.createFeedback($scope.form).then(item=>{ $scope.submitted = true; $scope.created=item; $scope.form={ title:'', description:'', category:'other', userEmail:'' }; });
    };
  });

  app.controller('SurveysCtrl', function($scope, Api){
    $scope.surveys=[]; $scope.newSurvey={ title:'', questions:[] };
    $scope.addQuestion = function(){ $scope.newSurvey.questions.push({ prompt:'', type:'text', options:[] }); };
    $scope.load = function(){ Api.listSurveys().then(d=>{ $scope.surveys = d; }); };
    $scope.create = function(){ if(!$scope.newSurvey.title) return; Api.createSurvey($scope.newSurvey).then(()=>{ $scope.newSurvey={ title:'', questions:[] }; $scope.load(); }); };
    $scope.answer = {}; // simple response holder
    $scope.respond = function(s){
      const answers = s.questions.map((q,i)=>({ questionIndex:i, answer:$scope.answer[s._id+':'+i]||'' }));
      Api.respondSurvey(s._id, { answers }).then(()=>{ alert('Response submitted'); });
    };
    $scope.load();
  });

  app.controller('MineCtrl', function($scope, Api){
    $scope.email = '';
    $scope.items=[];
    $scope.search = function(){ Api.listFeedback({ email:$scope.email }).then(d=>{ $scope.items=d; }); };
  });

  app.controller('AdminCtrl', function($scope, Api){
    $scope.items=[]; $scope.filter={ status:'', category:'' };
    $scope.load = function(){ Api.listFeedback($scope.filter).then(d=>{ $scope.items=d; }); };
    $scope.update = function(item){ Api.updateStatus(item._id, item.status).then(()=>{}); };
    $scope.load();
  });
})();


