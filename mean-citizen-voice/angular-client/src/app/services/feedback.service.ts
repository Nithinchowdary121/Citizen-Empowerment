import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private apiUrl = 'http://localhost:4001/api';
  
  constructor(private http: HttpClient) { }
  
  submitFeedback(feedback: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/feedback`, feedback);
  }
  
  getFeedback(params: any = {}): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/feedback`, { params });
  }
  
  getFeedbackByIds(ids: string[]): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/feedback/byIds`, { 
      params: { ids: ids.join(',') } 
    });
  }
  
  updateFeedbackStatus(id: string, status: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/feedback/${id}/status`, { status });
  }
  
  deleteFeedback(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/feedback/${id}`);
  }
  
  getReportSummary(): Observable<any> {
    return this.http.get(`${this.apiUrl}/reports/summary`);
  }
}