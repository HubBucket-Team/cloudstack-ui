import { Component,
  OnInit,
  Inject,
  ViewChild,
  HostBinding
} from '@angular/core';

import { VmService, IVmActionEvent } from '../shared/vm.service';
import { VirtualMachine } from '../shared/vm.model';
import { MdlDialogService } from 'angular2-mdl';
import { TranslateService } from 'ng2-translate';
import { IStorageService } from '../../shared/services/storage.service';
import { VmCreationComponent } from '../vm-creation/vm-creation.component';
import {
  JobsNotificationService,
  INotificationStatus
} from '../../shared/services/jobs-notification.service';

import { IAsyncJob } from '../../shared/models/async-job.model';
import { AsyncJobService } from '../../shared/services/async-job.service';
import { VmStatisticsComponent } from '../vm-statistics/vm-statistics.component';
import { StatsUpdateService } from '../../shared/services/stats-update.service';
import { ServiceOfferingService } from '../../shared/services/service-offering.service';

const askToCreateVm = 'askToCreateVm';


@Component({
  selector: 'cs-vm-list',
  templateUrl: 'vm-list.component.html',
  styleUrls: ['vm-list.component.scss']
})
export class VmListComponent implements OnInit {
  @ViewChild(VmStatisticsComponent) public vmStats: VmStatisticsComponent;
  @ViewChild(VmCreationComponent) public vmCreationForm: VmCreationComponent;
  @HostBinding('class.mdl-color--grey-100') public backgroundColorClass = true;

  private vmList: Array<VirtualMachine>;
  private selectedVm: VirtualMachine;
  private isDetailOpen: boolean;

  constructor (
    private vmService: VmService,
    private dialogService: MdlDialogService,
    private translateService: TranslateService,
    @Inject('IStorageService') protected storageService: IStorageService,
    private jobsNotificationService: JobsNotificationService,
    private asyncJobService: AsyncJobService,
    private statsUpdateService: StatsUpdateService,
    private serviceOfferingService: ServiceOfferingService
  ) { }

  public ngOnInit(): void {
    this.vmService.getList()
      .subscribe(vmList => {
        this.vmList = vmList;

        if (this.vmList.length) {
          return;
        }

        if (this.storageService.read(askToCreateVm) === 'false') {
          return;
        }

        this.translateService.get([
          'YES',
          'NO',
          'NO_DONT_ASK',
          'WOULD_YOU_LIKE_TO_CREATE_VM'
        ]).subscribe(translations => {
          this.showDialog(translations);
        });
      });
    this.statsUpdateService.subscribe(() => this.updateStats());
    this.asyncJobService.event.subscribe((job: IAsyncJob<any>) => {
      if (job.jobResult && job.jobInstanceType === 'VirtualMachine' && job.jobResult.state === 'Destroyed') {
        this.vmList.splice(this.vmList.findIndex(vm => vm.id === job.jobResult.id), 1);
        if (this.selectedVm && this.selectedVm.id === job.jobResult.id) {
          this.isDetailOpen = false;
        }
        this.updateStats();
      }
      if (job.jobResult && job.jobInstanceType === 'Snapshot') {
        this.vmList.forEach((vm, index, array) => {
          let vol = vm.volumes.findIndex(volume => volume.id === job.jobResult.volumeId);
          if (vol !== -1) { array[index].volumes[vol].snapshots.unshift(job.jobResult); }
        });
      }
    });
    this.vmService.resubscribe().subscribe(observables => {
      observables.forEach(observable => {
        observable.subscribe(job => {
          const action = VirtualMachine.getAction(job.cmd);
          this.translateService.get([
            'YES',
            'NO',
            action.confirmMessage,
            action.progressMessage,
            action.successMessage
          ]).subscribe(strs => {
            this.jobsNotificationService.add({
              message: strs[action.successMessage],
              status: INotificationStatus.Finished
            });
          });
        });
      });
    });
    this.vmService.vmUpdateObservable.subscribe(updatedVm => {
      this.vmList.forEach((vm, index, vmList) => {
        if (vm.id !== updatedVm.id) {
          return;
        }
        this.serviceOfferingService.get(updatedVm.serviceOfferingId)
          .subscribe(serviceOffering => {
            vmList[index].cpuSpeed = updatedVm.cpuSpeed;
            vmList[index].memory = updatedVm.memory;
            vmList[index].cpuNumber = updatedVm.cpuNumber;
            vmList[index].serviceOffering = serviceOffering;
            vmList[index].serviceOfferingId = updatedVm.serviceOfferingId;
          });
        this.updateStats();
      });
    });
  }

  public updateStats(): void {
    this.vmStats.updateStats();
  }

  public vmAction(e: IVmActionEvent): void {
    this.vmService.vmAction(e);
  }

  public onVmCreated(e): void {
    this.vmList.push(e);
    this.updateStats();
  }

  public showDetail(vm: VirtualMachine): void {
    this.isDetailOpen = true;
    this.selectedVm = vm;
  }

  public hideDetail(): void {
    this.isDetailOpen = false;
  }

  private showDialog(translations): void {
    this.dialogService.showDialog({
      message: translations['WOULD_YOU_LIKE_TO_CREATE_VM'],
      actions: [
        {
          handler: () => {
            this.vmCreationForm.show();
          },
          text: translations['YES']
        },
        {
          handler: () => { },
          text: translations['NO']
        },
        {
          handler: () => {
            this.storageService.write(askToCreateVm, 'false');
          },
          text: translations['NO_DONT_ASK']
        }
      ],
      fullWidthAction: true,
      isModal: true,
      clickOutsideToClose: true,
      styles: { 'width': '320px' }
    });
  }
}