import { Pipe, PipeTransform } from '@angular/core'

@Pipe({
  name: 'nl2br',
})
export class Nl2BrPipe implements PipeTransform {
  constructor() { }

  public transform(value: string): string {
    return value.replace(/(?:\r\n|\r|\n)/g, '<br />')
  }
}
