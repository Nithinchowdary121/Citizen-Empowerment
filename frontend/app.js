(function(){
  const app = angular.module('cvApp', ['ngRoute']);
  // In production, API calls will be relative to the same domain
  const API = window.location.hostname === 'localhost' ? 'http://localhost:4001' : '';

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
    
    $scope.refreshData = function() {
      Api.reports().then(d=>{ $scope.metrics=d; });
      Api.listFeedback().then(d=>{ $scope.feedback=d.slice(0,8); });
      Api.listResponses().then(d=>{ $scope.responses=d.slice(0,8); });
    };
    
    // Initialize data
    $scope.refreshData();
    
    // Status color mapping for visualization
    $scope.getStatusColor = function(status) {
      const colors = {
        'submitted': '#1e88e5',
        'in_review': '#ff8f00',
        'accepted': '#4caf50',
        'in_progress': '#9c27b0',
        'resolved': '#4caf50',
        'rejected': '#e53935'
      };
      return colors[status] || '#9e9e9e';
    };
    
    // Export feedback data to CSV
    $scope.exportFeedback = function() {
      if (!$scope.feedback || $scope.feedback.length === 0) return;
      
      const headers = ['Title', 'Description', 'Category', 'Status', 'User Email', 'Created At'];
      const csvContent = $scope.feedback.map(item => {
        return [
          item.title,
          item.description,
          item.category,
          item.status,
          item.userEmail || '',
          new Date(item.createdAt).toLocaleString()
        ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',');
      });
      
      const csv = [headers.join(','), ...csvContent].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', 'feedback_export.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    
    // View response details
    $scope.viewResponse = function(response) {
      $scope.selectedResponse = response;
      // In a real app, this would show a modal with response details
      alert('Response details: ' + JSON.stringify(response.answers));
    };
    
    // Edit feedback
    $scope.editFeedback = function(item) {
      // In a real app, this would open an edit modal
      const newStatus = prompt('Update status:', item.status);
      if (newStatus && newStatus !== item.status) {
        Api.updateStatus(item._id, newStatus).then(updated => {
          const index = $scope.feedback.findIndex(f => f._id === item._id);
          if (index !== -1) {
            $scope.feedback[index] = updated;
          }
        });
      }
    };
    
    $scope.removeFeedback = function(item){ 
      if (confirm('Are you sure you want to delete this feedback?')) {
        Api.deleteFeedback(item._id).then(()=>{ 
          $scope.feedback = $scope.feedback.filter(x=>x._id!==item._id);
        });
      }
    };
    
    $scope.removeResponse = function(item){ 
      if (confirm('Are you sure you want to delete this response?')) {
        Api.deleteResponse(item._id).then(()=>{ 
          $scope.responses = $scope.responses.filter(x=>x._id!==item._id);
        });
      }
    };
  });

  app.controller('SubmitCtrl', function($scope, Api){
    // Initialize form with default values
    $scope.initForm = function() {
      $scope.form = { 
        title: '', 
        description: '', 
        category: 'other', 
        userEmail: '' 
      };
    };
    
    $scope.initForm();
    $scope.submitted = false;
    
    // Submit feedback
    $scope.submit = function(){
      if ($scope.feedbackForm.$invalid) return;
      
      // Show loading state
      $scope.isSubmitting = true;
      
      Api.createFeedback($scope.form).then(
        function success(item) { 
          $scope.submitted = true; 
          $scope.created = item;
          $scope.isSubmitting = false;
        },
        function error(err) {
          $scope.errorMessage = "Failed to submit feedback. Please try again.";
          $scope.isSubmitting = false;
        }
      );
    };
    
    // Reset form to default values
    $scope.resetForm = function() {
      $scope.initForm();
      $scope.feedbackForm.$setPristine();
      $scope.feedbackForm.$setUntouched();
      $scope.errorMessage = null;
    };
    
    // Submit another feedback after successful submission
    $scope.submitAnother = function() {
      $scope.resetForm();
      $scope.submitted = false;
    };
  });

  app.controller('SurveysCtrl', function($scope, Api){
    // Initialize data
    $scope.surveys = [];
    $scope.answer = {};
    $scope.activeTab = 'participate';
    $scope.selectedSurveyId = '';
    $scope.surveyResponses = [];
    $scope.isLoadingResults = false;
    
    // Load surveys
    $scope.load = function(){ 
      Api.listSurveys().then(function(data) { 
        $scope.surveys = data; 
      }); 
    };
    
    // Tab navigation
    $scope.setActiveTab = function(tab) {
      $scope.activeTab = tab;
      if (tab === 'results' && $scope.surveys.length > 0 && !$scope.selectedSurveyId) {
        $scope.selectedSurveyId = $scope.surveys[0]._id;
        $scope.loadSurveyResults();
      }
    };
    
    // Calculate completion percentage for a survey
    $scope.getCompletionPercentage = function(survey) {
      if (!survey || !survey.questions || survey.questions.length === 0) return 0;
      
      let answeredCount = 0;
      survey.questions.forEach(function(q, i) {
        if ($scope.answer[survey._id + ':' + i]) {
          answeredCount++;
        }
      });
      
      return Math.round((answeredCount / survey.questions.length) * 100);
    };
    
    // Check if survey can be submitted
    $scope.canSubmitSurvey = function(survey) {
      return $scope.getCompletionPercentage(survey) > 0;
    };
    
    // Reset a survey's answers
    $scope.resetSurvey = function(survey) {
      survey.questions.forEach(function(q, i) {
        delete $scope.answer[survey._id + ':' + i];
      });
    };
    
    // Submit survey response
    $scope.respond = function(survey) {
      if (!$scope.canSubmitSurvey(survey)) return;
      
      const answers = survey.questions.map((q, i) => ({ 
        questionIndex: i, 
        answer: $scope.answer[survey._id + ':' + i] || '' 
      }));
      
      Api.respondSurvey(survey._id, { answers }).then(function() {
        $scope.resetSurvey(survey);
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.innerHTML = '<div class="success-icon">✓</div><div>Response submitted successfully!</div>';
        successMessage.style.position = 'fixed';
        successMessage.style.top = '20px';
        successMessage.style.right = '20px';
        successMessage.style.padding = '15px 20px';
        successMessage.style.background = 'rgba(76,175,80,.1)';
        successMessage.style.border = '1px solid rgba(76,175,80,.3)';
        successMessage.style.borderRadius = '8px';
        successMessage.style.display = 'flex';
        successMessage.style.alignItems = 'center';
        successMessage.style.gap = '10px';
        successMessage.style.zIndex = '1000';
        document.body.appendChild(successMessage);
        
        setTimeout(function() {
          document.body.removeChild(successMessage);
        }, 3000);
      });
    };
    
    // Load survey results
    $scope.loadSurveyResults = function() {
      if (!$scope.selectedSurveyId) return;
      
      $scope.isLoadingResults = true;
      $scope.surveyResponses = [];
      
      Api.getRecentResponses().then(function(responses) {
        $scope.surveyResponses = responses.filter(function(r) {
          return r.surveyId === $scope.selectedSurveyId;
        });
        $scope.isLoadingResults = false;
      });
    };
    
    // Get selected survey object
    $scope.getSelectedSurvey = function() {
      return $scope.surveys.find(function(s) {
        return s._id === $scope.selectedSurveyId;
      }) || {};
    };
    
    // Get responses for a specific question
    $scope.getResponsesForQuestion = function(questionIndex) {
      return $scope.surveyResponses.map(function(response) {
        const answer = response.answers.find(function(a) {
          return a.questionIndex === questionIndex;
        });
        return answer ? answer.answer : '';
      }).filter(Boolean);
    };
    
    // Get rating distribution for a question
    $scope.getRatingDistribution = function(questionIndex) {
      const ratings = [0, 0, 0, 0, 0]; // 1-5 stars
      
      $scope.getResponsesForQuestion(questionIndex).forEach(function(answer) {
        const rating = parseInt(answer);
        if (rating >= 1 && rating <= 5) {
          ratings[rating - 1]++;
        }
      });
      
      return ratings;
    };
    
    // Get maximum rating count for scaling bars
    $scope.getMaxRatingCount = function(questionIndex) {
      return Math.max(...$scope.getRatingDistribution(questionIndex), 1);
    };
    
    // Get average rating for a question
    $scope.getAverageRating = function(questionIndex) {
      const ratings = $scope.getResponsesForQuestion(questionIndex)
        .map(function(r) { return parseInt(r); })
        .filter(function(r) { return !isNaN(r); });
      
      if (ratings.length === 0) return 0;
      
      const sum = ratings.reduce(function(a, b) { return a + b; }, 0);
      return sum / ratings.length;
    };
    
    // Get percentage for a choice option
    $scope.getChoicePercentage = function(questionIndex, option) {
      const responses = $scope.getResponsesForQuestion(questionIndex);
      if (responses.length === 0) return 0;
      
      const count = responses.filter(function(r) { return r === option; }).length;
      return Math.round((count / responses.length) * 100);
    };
    
    // Get average completion time
    $scope.getAverageCompletionTime = function() {
      return '2.5 min'; // Placeholder - would calculate from actual timestamps in a real app
    };
    
    // Get response rate
    $scope.getResponseRate = function() {
      return Math.round(($scope.surveyResponses.length / 100) * 100); // Placeholder calculation
    };
    
    // Export results to CSV
    $scope.exportResults = function() {
      if (!$scope.selectedSurveyId || $scope.surveyResponses.length === 0) return;
      
      const survey = $scope.getSelectedSurvey();
      const headers = ['Response ID', 'Email', 'Date'];
      
      // Add question headers
      survey.questions.forEach(function(q, i) {
        headers.push(`Q${i+1}: ${q.prompt}`);
      });
      
      // Create CSV rows
      const csvContent = $scope.surveyResponses.map(function(response) {
        const row = [
          response._id,
          response.userEmail || 'Anonymous',
          new Date(response.createdAt).toLocaleDateString()
        ];
        
        // Add answers
        survey.questions.forEach(function(q, i) {
          const answer = response.answers.find(function(a) {
            return a.questionIndex === i;
          });
          row.push(answer ? answer.answer : '');
        });
        
        return row.join(',');
      });
      
      // Download CSV
      const csv = [headers.join(','), ...csvContent].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `survey_results_${survey.title}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    
    // Initialize
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
      byIds: (ids) => $http.get('http://localhost:4000/api/feedback/byIds', { params: { ids: ids.join(',') } }).then(r=>r.data)
    };
  });

  app.controller('AdminCtrl', function($scope, Api){
    $scope.items=[]; $scope.filter={ status:'', category:'' };
    $scope.load = function(){ Api.listFeedback($scope.filter).then(d=>{ $scope.items=d; }); };
    $scope.update = function(item){ Api.updateStatus(item._id, item.status).then(()=>{}); };
    $scope.load();
  });
})();


