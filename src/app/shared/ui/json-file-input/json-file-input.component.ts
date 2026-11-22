import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { TEXTS, fill } from '@shared/texts/texts';

/**
 * Zone de dépôt d'un fichier `.json` pour un import de séance. Seul le nom du fichier s'affiche, jamais son
 * contenu ; le contenu brut est émis au parent, qui valide. Sert aux imports de séances.
 */
@Component({
  selector: 'sh-json-file-input',
  templateUrl: './json-file-input.component.html',
  styleUrl: './json-file-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonFileInputComponent {
  readonly label = input.required<string>();
  readonly disabled = input(false);

  readonly contentChange = output<string>();

  protected readonly t = TEXTS;
  protected readonly fill = fill;
  protected readonly fileName = signal<string | null>(null);
  protected readonly dragging = signal(false);

  protected onDragOver(event: DragEvent): void {
    if (this.disabled()) {
      return;
    }
    event.preventDefault();
    this.dragging.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
  }

  protected async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    this.dragging.set(false);
    if (this.disabled()) {
      return;
    }
    const file = event.dataTransfer?.files.item(0) ?? null;
    if (!file) {
      return;
    }
    const content = await file.text();
    this.fileName.set(file.name);
    this.contentChange.emit(content);
  }
}
