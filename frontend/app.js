(function(){
  const app = angular.module('cvApp', ['ngRoute']);
  const API = 'http://localhost:4001';
  
  // Global error decoder function
  app.factory('ErrorDecoder', function() {
    return {
      decode: function(err) {
        if (!err) return 'Unknown error occurred';
        if (typeof err === 'string') return err;
        if (err.data && err.data.error) return err.data.error;
        if (err.status === 401) return 'Authentication required';
        if (err.status === 403) return 'You do not have permission to perform this action';
        if (err.status === 404) return 'The requested resource was not found';
        if (err.status === 500) return 'Server error occurred';
        return 'An unexpected error occurred';
      }
    };
  });

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
  app.controller('LoginCtrl', function($scope, Api, $location, ErrorDecoder){
    $scope.role = 'citizen';
    $scope.form = { email:'', password:'' };
    $scope.error = '';
    $scope.login = function(){
      $scope.error = '';
      const payload = { role: $scope.role, email: $scope.form.email, password: $scope.form.password };
      Api.login(payload).then(()=>{
        if ($scope.role==='admin') { localStorage.setItem('cv_role','admin'); $location.path('/dashboard'); }
        else { localStorage.setItem('cv_role','citizen'); localStorage.setItem('cv_email',$scope.form.email||''); $location.path('/home'); }
      }).catch(err=>{ $scope.error = ErrorDecoder.decode(err); });
    };
  });

  app.controller('HomeCtrl', function($scope, Api, ErrorDecoder){
    $scope.metrics = null;
    $scope.error = '';
    Api.reports().then(data=>{ $scope.metrics = data; })
      .catch(err=>{ $scope.error = ErrorDecoder.decode(err); });
  });

  app.controller('DashboardCtrl', function($scope, Api, ErrorDecoder){
    $scope.metrics = null;
    $scope.feedback = [];
    $scope.responses = [];
    $scope.errors = {
      metrics: '',
      feedback: '',
      responses: '',
      delete: ''
    };

    // Use the global error decoder
    $scope.decodeError = function(err) {
      return ErrorDecoder.decode(err);
    };
    
    // Sample data for when API fails or is empty
    const sampleMetrics = {
      total: 127,
      pending: 23,
      inProgress: 42,
      resolved: 62,
      byCategory: {
        "Parks & Recreation": 34,
        "Roads & Infrastructure": 41,
        "Public Safety": 19,
        "City Services": 22,
        "Community Development": 11
      }
    };
    
    const sampleFeedback = [
      { id: 'f1', title: 'Pothole on Main Street', category: 'Roads & Infrastructure', status: 'in-progress', date: '2023-06-01', email: 'john.smith@example.com' },
      { id: 'f2', title: 'Playground equipment needs repair', category: 'Parks & Recreation', status: 'pending', date: '2023-06-02', email: 'sarah.jones@example.com' },
      { id: 'f3', title: 'Streetlight out on Oak Avenue', category: 'Public Safety', status: 'pending', date: '2023-06-03', email: 'mike.johnson@example.com' },
      { id: 'f4', title: 'Request for additional recycling bins', category: 'City Services', status: 'resolved', date: '2023-05-28', email: 'lisa.williams@example.com' },
      { id: 'f5', title: 'Noise complaint - Downtown construction', category: 'Community Development', status: 'in-progress', date: '2023-05-30', email: 'robert.davis@example.com' }
    ];
    
    const sampleResponses = [
      { id: 'r1', surveyTitle: 'Downtown Revitalization Project', date: '2023-06-01', email: 'citizen1@example.com' },
      { id: 'r2', surveyTitle: 'Parks Improvement Survey', date: '2023-06-02', email: 'citizen2@example.com' },
      { id: 'r3', surveyTitle: 'Public Transportation Feedback', date: '2023-06-01', email: 'citizen3@example.com' },
      { id: 'r4', surveyTitle: 'Community Events Planning', date: '2023-05-29', email: 'citizen4@example.com' },
      { id: 'r5', surveyTitle: 'City Website Usability', date: '2023-05-28', email: 'citizen5@example.com' }
    ];

    Api.reports().then(d=>{ 
      $scope.metrics = d && Object.keys(d).length ? d : sampleMetrics; 
      $scope.errors.metrics = '';
    }).catch(err => {
      $scope.metrics = sampleMetrics;
      $scope.errors.metrics = $scope.decodeError(err);
    });

    Api.listFeedback().then(d=>{ 
      $scope.feedback = d && d.length ? d.slice(0,8) : sampleFeedback; 
      $scope.errors.feedback = '';
    }).catch(err => {
      $scope.feedback = sampleFeedback;
      $scope.errors.feedback = $scope.decodeError(err);
    });

    Api.listResponses().then(d=>{ 
      $scope.responses = d && d.length ? d.slice(0,8) : sampleResponses; 
      $scope.errors.responses = '';
    }).catch(err => {
      $scope.responses = sampleResponses;
      $scope.errors.responses = $scope.decodeError(err);
    });

    $scope.removeFeedback = function(item){ 
      Api.deleteFeedback(item._id).then(()=>{ 
        $scope.feedback = $scope.feedback.filter(x=>x._id!==item._id); 
        $scope.errors.delete = '';
      }).catch(err => {
        $scope.errors.delete = $scope.decodeError(err);
      }); 
    };

    $scope.removeResponse = function(item){ 
      Api.deleteResponse(item._id).then(()=>{ 
        $scope.responses = $scope.responses.filter(x=>x._id!==item._id); 
        $scope.errors.delete = '';
      }).catch(err => {
        $scope.errors.delete = $scope.decodeError(err);
      }); 
    };
  });

  app.controller('SubmitCtrl', function($scope, Api, ErrorDecoder){
    // Initialize form with user email from localStorage if available
    const userEmail = localStorage.getItem('cv_email') || '';
    $scope.form = { title:'', description:'', category:'other', userEmail: userEmail };
    $scope.submitted = false;
    $scope.error = '';
    $scope.success = '';
    
    $scope.submit = function(){
      $scope.error = '';
      $scope.success = '';
      
      // Validate required fields
      if(!$scope.form.title || !$scope.form.description) { 
        $scope.error = 'Please fill in the title and description'; 
        return; 
      }
      
      // Create a copy of the form data to submit
      const payload = {...$scope.form};
      
      // Store in local storage as backup
      try {
        const storedSuggestions = JSON.parse(localStorage.getItem('cv_suggestions') || '[]');
        storedSuggestions.push({
          ...payload,
          date: new Date().toISOString(),
          status: 'pending',
          localId: 'local_' + Date.now()
        });
        localStorage.setItem('cv_suggestions', JSON.stringify(storedSuggestions));
      } catch(e) {
        console.error('Failed to store suggestion locally', e);
      }
      
      // Submit to API
      Api.createFeedback(payload).then(item=>{ 
        $scope.submitted = true; 
        $scope.created = item; 
        $scope.success = 'Suggestion submitted successfully';
        $scope.form = { title:'', description:'', category:'other', userEmail: userEmail }; 
      }).catch(err=>{ 
        // Still show success if we saved locally
        if (localStorage.getItem('cv_suggestions')) {
          $scope.submitted = true;
          $scope.success = 'Your suggestion was saved locally!';
          $scope.form = { title:'', description:'', category:'other', userEmail: userEmail };
        } else {
          $scope.error = ErrorDecoder.decode(err);
        }
      });
    };
  });

  app.controller('SurveysCtrl', function($scope, Api, ErrorDecoder){
    $scope.surveys = [];
    $scope.loading = true;
    $scope.error = '';
    $scope.success = '';
    $scope.responses = {};
    
    // Use the global error decoder
    $scope.decodeError = function(err) {
      return ErrorDecoder.decode(err);
    };

    // Sample surveys data for when API fails or returns empty
    const sampleSurveys = [
      {
        id: 's1',
        title: 'Downtown Revitalization Project',
        description: 'Help us shape the future of downtown Greenfield. Your input will guide our revitalization efforts.',
        active: true,
        questions: [
          { id: 'q1', text: 'How often do you visit downtown Greenfield?', type: 'choice', required: true, options: ['Daily', 'Weekly', 'Monthly', 'Rarely', 'Never'] },
          { id: 'q2', text: 'What would make you visit downtown more often?', type: 'text', required: true },
          { id: 'q3', text: 'Rate the importance of adding more green spaces downtown:', type: 'rating', required: true }
        ]
      },
      {
        id: 's2',
        title: 'Parks Improvement Survey',
        description: 'We want to enhance our city parks. Please share your thoughts on current facilities and future improvements.',
        active: true,
        questions: [
          { id: 'q1', text: 'Which city park do you visit most frequently?', type: 'choice', required: true, options: ['Greenfield Central Park', 'Riverside Park', 'Oak Hill Park', 'Meadow View Park', 'Other'] },
          { id: 'q2', text: 'What new facilities would you like to see added to our parks?', type: 'text', required: false },
          { id: 'q3', text: 'Rate the current maintenance of park facilities:', type: 'rating', required: true }
        ]
      },
      {
        id: 's3',
        title: 'Public Transportation Feedback',
        description: 'Help us improve Greenfield\'s public transportation system to better serve our community.',
        active: true,
        questions: [
          { id: 'q1', text: 'How often do you use public transportation in Greenfield?', type: 'choice', required: true, options: ['Daily', 'Weekly', 'Monthly', 'Rarely', 'Never'] },
          { id: 'q2', text: 'What routes or areas need better public transportation coverage?', type: 'text', required: false },
          { id: 'q3', text: 'Rate the overall quality of our current public transportation system:', type: 'rating', required: true }
        ]
      }
    ];

    Api.listSurveys().then(d=>{
      $scope.surveys = d && d.length ? d : sampleSurveys;
      $scope.loading = false;
    }).catch(err=>{
      $scope.surveys = sampleSurveys;
      $scope.error = $scope.decodeError(err);
      $scope.loading = false;
    });

    $scope.submitResponse = function(survey){
      $scope.error = '';
      $scope.success = '';
      const payload = { responses: {} };
      const userEmail = localStorage.getItem('cv_email') || '';
      
      // Add user email to payload
      payload.userEmail = userEmail;
      
      // Validate and collect responses
      let valid = true;
      survey.questions.forEach(q => {
        if (q.required && !$scope.responses[survey.id+'-'+q.id]) {
          valid = false;
          $scope.error = 'Please answer all required questions';
        }
        payload.responses[q.id] = $scope.responses[survey.id+'-'+q.id] || '';
      });
      
      if (!valid) return;
      
      // Store in local storage as backup
      try {
        const storedResponses = JSON.parse(localStorage.getItem('cv_survey_responses') || '[]');
        storedResponses.push({
          surveyId: survey.id || survey._id,
          surveyTitle: survey.title,
          responses: payload.responses,
          date: new Date().toISOString()
        });
        localStorage.setItem('cv_survey_responses', JSON.stringify(storedResponses));
      } catch(e) {
        console.error('Failed to store survey response locally', e);
      }
      
      Api.respondSurvey(survey.id || survey._id, payload).then(()=>{
        $scope.success = 'Thank you for your response!';
        // Clear form
        survey.questions.forEach(q => {
          $scope.responses[survey.id+'-'+q.id] = '';
        });
      }).catch(err=>{
        // Still show success if we at least tried and saved locally
        if (localStorage.getItem('cv_survey_responses')) {
          $scope.success = 'Your response was saved locally!';
          // Clear form
          survey.questions.forEach(q => {
            $scope.responses[survey.id+'-'+q.id] = '';
          });
        } else {
          $scope.error = $scope.decodeError(err);
        }
      });
    };
  });

  app.controller('MineCtrl', function($scope, Api, ErrorDecoder){
    $scope.items=[];
    $scope.form = { title:'', category:'services', description:'', userEmail:'' };
    $scope.error = '';
    $scope.success = '';
    function loadMyIds(){ try { return JSON.parse(localStorage.getItem('cv_my_feedback_ids')||'[]'); } catch(e){ return []; } }
    function saveMyIds(ids){ localStorage.setItem('cv_my_feedback_ids', JSON.stringify(ids)); }
    function loadList(){
      const ids = loadMyIds();
      if(ids.length===0){ $scope.items=[]; return; }
      Api.listFeedbackByIds(ids).then(d=>{ $scope.items=d; $scope.error=''; }).catch(err=>{ $scope.error = ErrorDecoder.decode(err); });
    }
    $scope.submitMine = function(){
      $scope.error=''; $scope.success='';
      if(!$scope.form.title || !$scope.form.description) { $scope.error = 'Please fill in the title and description'; return; }
      Api.createFeedback($scope.form).then(()=>{
        $scope.form = { title:'', category:'services', description:'', userEmail:'' };
        $scope.success = 'Suggestion submitted successfully';
        // store id for local history (requires server to return created _id)
      }).then(()=>{ return Api.listFeedback({ category:'', status:'' }); }).then(all=>{
        // naive last insert grab for demo purposes
        if(Array.isArray(all) && all.length){
          const newestId = all[0]._id;
          const ids = loadMyIds();
          if(!ids.includes(newestId)){ ids.unshift(newestId); saveMyIds(ids.slice(0,50)); }
          loadList();
        }
      }).catch(err=>{ $scope.error = ErrorDecoder.decode(err); });
    };
    // augment API with byIds call
  });

  // extend Api service without breaking references
  app.factory('ApiByIds', function($http){
    return {
      byIds: (ids) => $http.get('http://localhost:4000/api/feedback/byIds', { params: { ids: ids.join(',') } }).then(r=>r.data)
    };
  });

  app.controller('AdminCtrl', function($scope, Api, ErrorDecoder){
    $scope.items=[]; $scope.filter={ status:'', category:'' };
    $scope.error = '';
    $scope.updateError = '';
    $scope.load = function(){ 
      Api.listFeedback($scope.filter).then(d=>{ $scope.items=d; $scope.error=''; })
        .catch(err=>{ $scope.error = ErrorDecoder.decode(err); }); 
    };
    $scope.update = function(item){ 
      Api.updateStatus(item._id, item.status).then(()=>{ $scope.updateError=''; })
        .catch(err=>{ $scope.updateError = ErrorDecoder.decode(err); }); 
    };
    $scope.load();
  });
})();


