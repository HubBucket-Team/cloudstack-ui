import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { DialogService } from '../../dialog/dialog-module/dialog.service';
import { Taggable } from '../../shared/interfaces/taggable.interface';
import { Tag } from '../../shared/models';
import { TagService } from '../../shared/services';
import { TagsComponent } from '../../tags/tags.component';
import { VmService } from '../../vm/shared/vm.service';


@Component({
  selector: 'cs-template-tags',
  templateUrl: 'template-tags.component.html'
})
export class TemplateTagsComponent extends TagsComponent {
  @Input() public entity: Taggable;

  constructor(
    protected dialogService: DialogService,
    protected tagService: TagService,
    private vmService: VmService
  ) {
    super(dialogService, tagService);
  }

  protected get entityTags(): Observable<Array<Tag>> {
    return this.vmService.get(this.entity.id).map(_ => _.tags);
  }
}
