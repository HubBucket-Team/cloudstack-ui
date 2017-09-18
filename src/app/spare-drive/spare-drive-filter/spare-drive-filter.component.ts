import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as sortBy from 'lodash/sortBy';
import { VolumeType, volumeTypeNames } from '../../shared/models/volume.model';
import { Zone } from '../../shared/models/zone.model';
import { FilterService } from '../../shared/services/filter.service';
import { LocalStorageService } from '../../shared/services/local-storage.service';


export interface SpareDriveFilter {
  spareOnly: boolean;
  selectedZones: Array<Zone>;
  selectedTypes: Array<VolumeType>;
  groupings: Array<any>;
  query: string;
}

export const spareDriveListFilters = 'spareDriveListFilters';

@Component({
  selector: 'cs-spare-drive-filter',
  templateUrl: 'spare-drive-filter.component.html',
  styleUrls: ['spare-drive-filter.component.scss']
})
export class SpareDriveFilterComponent implements OnChanges {
  @Input() public zones: Array<Zone>;
  @Input() public groupings: Array<any>;
  @Input() public searchPanelWhite: boolean;
  @Output() public updateFilters: EventEmitter<SpareDriveFilter>;

  public types = [VolumeType.ROOT, VolumeType.DATADISK];
  public selectedTypes: Array<VolumeType> = [];

  public spareOnly: boolean;

  public selectedZones: Array<Zone> = [];
  public selectedGroupingNames = [];
  public query: string;

  private filtersKey = spareDriveListFilters;
  private filterService = new FilterService({
    spareOnly: { type: 'boolean', defaultOption: false },
    zones: { type: 'array', defaultOption: [] },
    types: { type: 'array', defaultOption: [] },
    groupings: { type: 'array', defaultOption: [] },
    query: { type: 'string' }
  }, this.router, this.localStorage, this.filtersKey, this.activatedRoute);

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private localStorage: LocalStorageService
  ) {
    this.updateFilters = new EventEmitter();
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['zones'] && changes['zones'].currentValue) {
      this.initFilters();
    }
  }

  public getVolumeTypeName(type: VolumeType): string {
    return volumeTypeNames[type];
  }

  public initFilters(): void {
    const params = this.filterService.getParams();

    this.spareOnly = params.spareOnly;
    this.query = params.query;

    this.selectedZones = this.zones.filter(zone =>
      params['zones'].find(id => id === zone.id)
    );

    this.selectedTypes = this.types.filter(type =>
      params['types'].find(_ => _ === type)
    );

    this.selectedGroupingNames = params.groupings.reduce((acc, _) => {
      const grouping = this.groupings.find(g => g.key === _);
      if (grouping) {
        acc.push(grouping);
      }
      return acc;
    }, []);

    this.update();
  }

  public update(): void {
    this.updateFilters.emit({
      spareOnly: this.spareOnly,
      selectedZones: sortBy(this.selectedZones, 'name'),
      selectedTypes: this.selectedTypes,
      groupings: this.selectedGroupingNames,
      query: this.query
    });

    this.filterService.update(this.filtersKey, {
      spareOnly: this.spareOnly,
      zones: this.selectedZones.map(_ => _.id),
      types: this.selectedTypes,
      groupings: this.selectedGroupingNames.map(_ => _.key),
      query: this.query
    });
  }
}