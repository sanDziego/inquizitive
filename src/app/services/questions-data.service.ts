import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class QuestionsDataService {

  constructor(private http: HttpClient) { }

  getCollectionId(short_id: string) {
    return this.http.get('https://ncia.wwnorton.com/product_config/gateways3.json?_=1584212444517').pipe(
      map( (result: any) => {
        let chapter =  result.toc.filter( item => item.short_id === short_id)[0];

        return chapter.collection_id;
      })
    );
  }

  getQuestionData(formData: FormData) {
    return this.http.post('https://ncia.wwnorton.com/services/activity_file.php', formData).pipe(
      map( result => (<any>result))
    );
  }
}
