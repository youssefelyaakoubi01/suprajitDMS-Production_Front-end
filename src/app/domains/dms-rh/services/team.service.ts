/**
 * DMS-RH Team Service
 * Domain: Human Resources Management
 */
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { Team, TeamMember, TeamStats } from '../models';
import { Employee } from '../models/employee.model';

@Injectable({
    providedIn: 'root'
})
export class DmsTeamService {
    private readonly endpoint = 'hr';

    constructor(private api: ApiService) {}

    // ==================== TEAMS ====================
    getTeams(): Observable<Team[]> {
        return this.api.get<Team[]>(`${this.endpoint}/teams`);
    }

    getTeam(id: number): Observable<Team> {
        return this.api.get<Team>(`${this.endpoint}/teams/${id}`);
    }

    createTeam(team: Partial<Team>): Observable<Team> {
        return this.api.post<Team>(`${this.endpoint}/teams`, team);
    }

    updateTeam(id: number, team: Partial<Team>): Observable<Team> {
        return this.api.put<Team>(`${this.endpoint}/teams/${id}`, team);
    }

    deleteTeam(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/teams/${id}`);
    }

    // ==================== TEAM MEMBERS ====================
    getTeamMembers(teamId: number): Observable<Employee[]> {
        return this.api.get<Employee[]>(`${this.endpoint}/teams/${teamId}/members`);
    }

    addTeamMember(teamId: number, employeeId: number, role: 'leader' | 'member' = 'member'): Observable<TeamMember> {
        return this.api.post<TeamMember>(`${this.endpoint}/teams/${teamId}/members`, {
            employee_id: employeeId,
            role
        });
    }

    removeTeamMember(teamId: number, employeeId: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/teams/${teamId}/members/${employeeId}`);
    }

    updateTeamMemberRole(teamId: number, employeeId: number, role: 'leader' | 'member'): Observable<TeamMember> {
        return this.api.put<TeamMember>(`${this.endpoint}/teams/${teamId}/members/${employeeId}`, { role });
    }

    // ==================== TEAM STATS ====================
    getTeamStats(teamId: number): Observable<TeamStats> {
        return this.api.get<TeamStats>(`${this.endpoint}/teams/${teamId}/stats`);
    }

    getAllTeamsStats(): Observable<TeamStats[]> {
        return this.api.get<TeamStats[]>(`${this.endpoint}/teams/stats`);
    }
}
