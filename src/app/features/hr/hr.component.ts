import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { AvatarModule } from 'primeng/avatar';
import { TabsModule } from 'primeng/tabs';
import { MessageService } from 'primeng/api';
import { Employee } from '../../core/models';

@Component({
    selector: 'app-hr',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CardModule,
        TableModule,
        InputTextModule,
        ButtonModule,
        TagModule,
        ToastModule,
        AvatarModule,
        TabsModule
    ],
    providers: [MessageService],
    templateUrl: './hr.component.html',
    styleUrls: ['./hr.component.scss']
})
export class HrComponent implements OnInit {
    employees: Employee[] = [];
    searchTerm = '';

    constructor(private messageService: MessageService) {}

    ngOnInit(): void {
        this.loadEmployees();
    }

    loadEmployees(): void {
        this.employees = [
            { Id_Emp: 54, Nom_Emp: 'ELBOURIANY', Prenom_Emp: 'WISSAL', DateNaissance_Emp: new Date('1990-05-15'), Genre_Emp: 'F', Categorie_Emp: 'Operator', DateEmbauche_Emp: new Date('2020-03-01'), Departement_Emp: 'Production', Picture: 'assets/images/avatar-default.png', EmpStatus: 'Active' },
            { Id_Emp: 55, Nom_Emp: 'BENALI', Prenom_Emp: 'AHMED', DateNaissance_Emp: new Date('1988-08-20'), Genre_Emp: 'M', Categorie_Emp: 'Operator', DateEmbauche_Emp: new Date('2019-06-15'), Departement_Emp: 'Production', Picture: 'assets/images/avatar-default.png', EmpStatus: 'Active' },
            { Id_Emp: 56, Nom_Emp: 'MARTIN', Prenom_Emp: 'SOPHIE', DateNaissance_Emp: new Date('1985-02-10'), Genre_Emp: 'F', Categorie_Emp: 'Team Leader', DateEmbauche_Emp: new Date('2015-01-10'), Departement_Emp: 'Production', Picture: 'assets/images/avatar-default.png', EmpStatus: 'Active' },
            { Id_Emp: 57, Nom_Emp: 'DUBOIS', Prenom_Emp: 'PIERRE', DateNaissance_Emp: new Date('1992-11-25'), Genre_Emp: 'M', Categorie_Emp: 'Technician', DateEmbauche_Emp: new Date('2021-09-01'), Departement_Emp: 'Maintenance', Picture: 'assets/images/avatar-default.png', EmpStatus: 'Active' },
            { Id_Emp: 58, Nom_Emp: 'MOREAU', Prenom_Emp: 'MARIE', DateNaissance_Emp: new Date('1995-07-30'), Genre_Emp: 'F', Categorie_Emp: 'Quality Inspector', DateEmbauche_Emp: new Date('2022-02-15'), Departement_Emp: 'Quality', Picture: 'assets/images/avatar-default.png', EmpStatus: 'Active' }
        ];
    }

    get filteredEmployees(): Employee[] {
        if (!this.searchTerm) return this.employees;
        const term = this.searchTerm.toLowerCase();
        return this.employees.filter(emp =>
            emp.Nom_Emp.toLowerCase().includes(term) ||
            emp.Prenom_Emp.toLowerCase().includes(term) ||
            emp.Departement_Emp.toLowerCase().includes(term)
        );
    }

    getStatusSeverity(status: string): 'success' | 'danger' | 'warn' {
        return status === 'Active' ? 'success' : 'danger';
    }

    viewEmployee(emp: Employee): void {
        this.messageService.add({ severity: 'info', summary: 'View', detail: `Viewing ${emp.Prenom_Emp} ${emp.Nom_Emp}` });
    }
}
