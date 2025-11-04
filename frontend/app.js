(function(){
  const app = angular.module('cvApp', ['ngRoute']);
  const API = 'http://localhost:4002';

  app.config(function($routeProvider, $locationProvider){
    $routeProvider
      .when('/', { templateUrl: 'views/login.html', controller: 'LoginCtrl' })
      .when('/home', { templateUrl: 'views/home.html', controller: 'HomeCtrl' })
      .when('/dashboard', { templateUrl: 'views/dashboard.html', controller: 'DashboardCtrl' })
      .when('/features/forms', { templateUrl: 'views/features/forms.html' })
      .when('/features/portal', { templateUrl: 'views/features/portal.html' })
      .when('/features/workflow', { templateUrl: 'views/features/workflow.html' })
      .when('/features/notifications', { templateUrl: 'views/features/notifications.html' })
      .when('/features/reports', { templateUrl: 'views/features/reports.html' })
      .when('/submit', { templateUrl: 'views/submit.html', controller: 'SubmitCtrl' })
      .when('/surveys', { templateUrl: 'views/surveys.html', controller: 'SurveysCtrl' })
      .when('/mine', { templateUrl: 'views/mine.html', controller: 'MineCtrl' })
      .when('/admin', { templateUrl: 'views/admin.html', controller: 'AdminCtrl' })
      .otherwise('/');
    $locationProvider.hashPrefix('');
  });

  app.factory('Api', function($http){
    return {
      login: (payload) => $http.post(API + '/api/auth/login', payload).then(r=>r.data),
      listFeedback: (params={}) => $http.get(API + '/api/feedback', { params }).then(r=>r.data),
      listFeedbackByIds: (ids=[]) => $http.get(API + '/api/feedback/byIds', { params: { ids: ids.join(',') } }).then(r=>r.data),
      createFeedback: (payload) => $http.post(API + '/api/feedback', payload).then(r=>r.data),
      deleteFeedback: (id) => $http.delete(API + '/api/feedback/'+id).then(r=>r.data),
      updateStatus: (id, status) => $http.patch(API + '/api/feedback/'+id+'/status', { status }).then(r=>r.data),
      reports: () => $http.get(API + '/api/reports/summary').then(r=>r.data),
      listSurveys: () => $http.get(API + '/api/surveys').then(r=>r.data),
      createSurvey: (payload) => $http.post(API + '/api/surveys', payload).then(r=>r.data),
      respondSurvey: (id, payload) => $http.post(API + '/api/surveys/'+id+'/responses', payload).then(r=>r.data),
      listResponses: () => $http.get(API + '/api/responses').then(r=>r.data),
      deleteResponse: (id) => $http.delete(API + '/api/responses/'+id).then(r=>r.data)
    };
  });
  app.controller('LoginCtrl', function($scope, Api, $location){
    $scope.role = 'citizen';
    $scope.form = { email:'', password:'' };
    $scope.error = '';
    $scope.login = function(){
      $scope.error = '';
      const payload = { role: $scope.role, email: $scope.form.email, password: $scope.form.password };
      Api.login(payload).then(()=>{
        if ($scope.role==='admin') { localStorage.setItem('cv_role','admin'); $location.path('/dashboard'); }
        else { localStorage.setItem('cv_role','citizen'); localStorage.setItem('cv_email',$scope.form.email||''); $location.path('/home'); }
      }).catch(err=>{ $scope.error = (err.data && err.data.error) || 'Login failed'; });
    };
  });

  app.controller('HomeCtrl', function($scope, Api){
    $scope.metrics = null;
    Api.reports().then(data=>{ $scope.metrics = data; });
  });

  app.controller('DashboardCtrl', function($scope, Api){
    $scope.metrics = null;
    $scope.feedback = [];
    $scope.responses = [];
    Api.reports().then(d=>{ $scope.metrics=d; });
    Api.listFeedback().then(d=>{ $scope.feedback=d.slice(0,8); });
    Api.listResponses().then(d=>{ $scope.responses=d.slice(0,8); });
    $scope.removeFeedback = function(item){ Api.deleteFeedback(item._id).then(()=>{ $scope.feedback = $scope.feedback.filter(x=>x._id!==item._id); }); };
    $scope.removeResponse = function(item){ Api.deleteResponse(item._id).then(()=>{ $scope.responses = $scope.responses.filter(x=>x._id!==item._id); }); };
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
    $scope.surveys=[];
    $scope.load = function(){ Api.listSurveys().then(d=>{ $scope.surveys = d; }); };
    $scope.answer = {};
    $scope.respond = function(s){
      const answers = s.questions.map((q,i)=>({ questionIndex:i, answer:$scope.answer[s._id+':'+i]||'' }));
      const email = localStorage.getItem('cv_email') || '';
      Api.respondSurvey(s._id, { answers, userEmail: email }).then(()=>{ 
        alert('Response submitted'); 
        $scope.answer = {}; // Clear answers after submission
      });
    };
    $scope.load();
  });

  app.controller('MineCtrl', function($scope, Api){
    $scope.items=[];
    $scope.form = { title:'', category:'services', description:'', userEmail:'' };
    function loadMyIds(){ try { return JSON.parse(localStorage.getItem('cv_my_feedback_ids')||'[]'); } catch(e){ return []; } }
    function saveMyIds(ids){ localStorage.setItem('cv_my_feedback_ids', JSON.stringify(ids)); }
    function loadList(){
      const ids = loadMyIds();
      if(ids.length===0){ $scope.items=[]; return; }
      Api.listFeedbackByIds(ids).then(d=>{ $scope.items=d; });
    }
    $scope.submitMine = function(){
      if(!$scope.form.title || !$scope.form.description) return;
      Api.createFeedback($scope.form).then(()=>{
        $scope.form = { title:'', category:'services', description:'', userEmail:'' };
        // store id for local history (requires server to return created _id)
      }).then(()=>{ return Api.listFeedback({ category:'', status:'' }); }).then(all=>{
        // naive last insert grab for demo purposes
        if(Array.isArray(all) && all.length){
          const newestId = all[0]._id;
          const ids = loadMyIds();
          if(!ids.includes(newestId)){ ids.unshift(newestId); saveMyIds(ids.slice(0,50)); }
          loadList();
        }
      });
    };
    // augment API with byIds call
  });

  // extend Api service without breaking references
  app.factory('ApiByIds', function($http){
    return {
      byIds: (ids) => $http.get(API + '/api/feedback/byIds', { params: { ids: ids.join(',') } }).then(r=>r.data)
    };
  });

  app.controller('AdminCtrl', function($scope, Api){
    $scope.items=[]; $scope.filter={ status:'', category:'' };
    $scope.load = function(){ Api.listFeedback($scope.filter).then(d=>{ $scope.items=d; }); };
    $scope.update = function(item){ Api.updateStatus(item._id, item.status).then(()=>{}); };
    $scope.load();
  });
})();


