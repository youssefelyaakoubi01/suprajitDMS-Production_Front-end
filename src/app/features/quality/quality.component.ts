import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageService } from 'primeng/api';
import { Defect, DefectList, QualityMetrics } from '../../core/models';

@Component({
    selector: 'app-quality',
    standalone: true,
    imports: [CommonModule, FormsModule, CardModule, TableModule, ChartModule, ButtonModule, TagModule, ToastModule, DialogModule, SelectModule, InputNumberModule],
    providers: [MessageService],
    templateUrl: './quality.component.html',
    styleUrls: ['./quality.component.scss']
})
export class QualityComponent implements OnInit {
    metrics: QualityMetrics = { ppm: 0, ftq: 0, scrapRate: 0, totalDefects: 0, totalOutput: 0 };
    defects: Defect[] = [];
    defectTypes: DefectList[] = [];
    paretoChartData: any;
    chartOptions: any;
    showDefectDialog = false;

    constructor(private messageService: MessageService) {}

    ngOnInit(): void {
        this.loadData();
        this.initChart();
    }

    loadData(): void {
        this.metrics = { ppm: 1250, ftq: 98.5, scrapRate: 1.2, totalDefects: 45, totalOutput: 36000 };
        this.defectTypes = [
            { Id_DefectList: 1, Code_Defect: 'DEF-001', Description_Defect: 'Surface Scratch', id_workstation: 1 },
            { Id_DefectList: 2, Code_Defect: 'DEF-002', Description_Defect: 'Dimensional Error', id_workstation: 1 },
            { Id_DefectList: 3, Code_Defect: 'DEF-003', Description_Defect: 'Missing Component', id_workstation: 2 }
        ];
    }

    initChart(): void {
        this.paretoChartData = {
            labels: ['Surface Scratch', 'Dimensional', 'Missing Part', 'Assembly', 'Other'],
            datasets: [{ label: 'Defects', data: [18, 12, 8, 5, 2], backgroundColor: '#EF4444' }]
        };
        this.chartOptions = { responsive: true, maintainAspectRatio: false, indexAxis: 'y' };
    }

    openDefectDialog(): void { this.showDefectDialog = true; }
    closeDefectDialog(): void { this.showDefectDialog = false; }
}
