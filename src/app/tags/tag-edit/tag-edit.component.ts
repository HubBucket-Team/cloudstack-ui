import { Component, Inject, Optional, ViewChild } from '@angular/core';
import { NgModel } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { MdlDialogReference } from '../../dialog/dialog-module';
import { DialogService } from '../../dialog/dialog-module/dialog.service';
import { Taggable } from '../../shared/interfaces/taggable.interface';
import { defaultCategoryName, Tag } from '../../shared/models';
import { TagService } from '../../shared/services';


@Component({
  selector: 'cs-tag-edit',
  templateUrl: 'tag-edit.component.html',
  styleUrls: ['tag-edit.component.scss']
})
export class TagEditComponent {
  @ViewChild('keyField') public keyField: NgModel;

  public loading: boolean;

  public key: string;
  public value: string;

  public maxKeyLength = 255;
  public maxValueLength = 255;

  constructor(
    @Optional() @Inject('forbiddenKeys') public forbiddenKeys: Array<string>,
    @Optional() @Inject('title') public title: string,
    @Optional() @Inject('confirmButtonText') public confirmButtonText: string,
    @Optional() @Inject('tag') private tag: Tag,
    @Optional() @Inject('entity') private entity: Taggable,
    @Optional() @Inject('categoryName') private categoryName: string,
    private dialog: MdlDialogReference,
    private dialogService: DialogService,
    private tagService: TagService
  ) {
    if (tag) {
      this.key = tag.key;
      this.value = tag.value;
    } else if (categoryName && categoryName !== defaultCategoryName) {
      this.key = `${categoryName}.`;
    }
  }

  public get keyFieldErrorMessage(): string {
    if (this.keyField.errors && this.keyField.errors.forbiddenValuesValidator) {
      return 'TAG_ALREADY_EXISTS';
    }

    return '';
  }

  public onCancel(): void {
    this.dialog.hide();
  }
}
