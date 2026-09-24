import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';

export default class AppState extends Service {
  @tracked private _error: unknown = null;
  get error() {
    return this._error;
  }

  readonly onUnrecoverableError = (error: unknown) => {
    void Promise.resolve().then(() => {
      if (!this._error) {
        this._error = error;
      }
      this.onSaveEnd();
    });
  };

  @tracked private _isEditing = false;
  get isEditing() {
    return this._isEditing;
  }

  readonly onEditStart = () => Promise.resolve().then(() => (this._isEditing = true));
  readonly onEditEnd = () => Promise.resolve().then(() => (this._isEditing = false));

  @tracked private _isSaving = false;
  get isSaving() {
    return this._isSaving;
  }

  readonly onSaveStart = () => {
    if (!this._isSaving) {
      this._isSaving = true;
    }
  };

  readonly onSaveEnd = () => {
    if (this._isSaving) {
      this._isSaving = false;
    }
  };

  get canToggle() {
    return !this._isEditing;
  }
}
