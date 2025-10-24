import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { SubmitFeedbackComponent } from './components/submit-feedback/submit-feedback.component';
import { MyFeedbackComponent } from './components/my-feedback/my-feedback.component';
import { SurveysComponent } from './components/surveys/surveys.component';
import { AdminComponent } from './components/admin/admin.component';

import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'submit-feedback', component: SubmitFeedbackComponent, canActivate: [AuthGuard] },
  { path: 'my-feedback', component: MyFeedbackComponent, canActivate: [AuthGuard] },
  { path: 'surveys', component: SurveysComponent, canActivate: [AuthGuard] },
  { path: 'admin', component: AdminComponent, canActivate: [AdminGuard] },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }