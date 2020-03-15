import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { QuestionsDataService } from './services/questions-data.service';
import { tap, finalize, catchError } from 'rxjs/operators'
import { trigger, transition, style, animate } from '@angular/animations'
import { of } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({transform: 'translateY(-5%)', opacity: 0}),
        animate('0.3s ease-in', style({transform: 'translateY(0%)', opacity: 1}))
      ]),
    ])
  ]
})

export class AppComponent implements OnInit {
  form : FormGroup;
  questions = [];
  submitted = false;
  searchComplete: boolean;
  errorOccured = false;
  title = '';

  constructor(
    private fb: FormBuilder,
    private questionsDataService: QuestionsDataService,
    private spinner: NgxSpinnerService) { }

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.form = this.fb.group({
      short_id: ''
    })
  }

  getCollectionId() {
    let id = '';
    this.submitted = true;
    this.spinner.show();

    this.questionsDataService.getCollectionId(`${this.short_id.value}`).pipe(
      tap( result => id = result),
      catchError(err => {
        this.errorOccured = true;
        return of(err);
      }),
      finalize( () => this.search(id))
    ).subscribe();
  }

  search(id: string) {
    const formData = new FormData();
    formData.append('collection_id',`${id}`);
    formData.append('dynamic_load','false');

    this.questionsDataService.getQuestionData(formData).pipe(
      tap(result => {
        this.parseQuestionTexts(result.questions);
        this.title = result.activity.title;
      }),
      catchError(err => {
        this.errorOccured = true;
        return of(err);
      }),
      finalize(() => {
        this.spinner.hide();
        this.searchComplete = true;
      })
    ).subscribe();
  }

  parseQuestionTexts(questions: any[]) {
    questions.forEach( question => {
      let questionText: string =  question.question_text;

      if (questionText.includes('<') && questionText.includes('>')) {
        question.question_text = this.stripHtml(questionText);
      }
    })
    this.getCorrectAnswersBasedOnTypes(questions);
  }

  getCorrectAnswersBasedOnTypes(questions: any[]) {
    // DONE --- MULTISELECT | MULTICHOICE | TRUEFALSE | SHORTANSWER | DRAGBLANKS | NUMERIC | ORDERING | MATCHING

    // TODO --- DRAGDROP | IMAGECLICK

    questions.forEach( question => {
      switch(question.type) {
        case 'multiselect':
          for( let i = 0; i < question.correct_answer.length; i++) {
            let answerAsText: string = question.choices[question.correct_answer.indexOf(question.correct_answer[i])].text;

            if (question.correct_answer[i] === "true") {
              question.correct_answer[i] = ' ' +  this.parseText(answerAsText) + ' ';
            } else if (question.correct_answer[i] === 'false') {
              question.correct_answer[i] = '';
            }
          }
          break;
        case 'multichoice':
        case 'numeric':
          let answerIndex2 = parseInt(question.correct_answer);
          let answerText2 = question.choices[answerIndex2].text;

          question.correct_answer = this.parseText(answerText2);
          break;
        case 'dragblanks':
          for( let i = 0; i < question.correct_answer.length; i++) {
            let answerIndex3 = parseInt(question.correct_answer[i]);

            question.correct_answer[i] = `${i + 1}:` + ' ' + this.parseText(question.labels[answerIndex3]) + ' ';
          }
          break;
        case 'matching':
          for( let i = 0; i < question.correct_answer.length; i++) {
            if (typeof question.correct_answer[i] === 'object') {
              for (let j = 0; j < question.correct_answer[i].length; j++) {
                question.correct_answer[i][j] =
                  this.parseText(question.labels[i]) + ' >>>> ' + this.parseText(question.targets[parseInt(question.correct_answer[i][j])]) + ' ';
              }
            } else if (parseInt(question.correct_answer[i]) || parseInt(question.correct_answer[i]) === 0) {
              question.correct_answer[i] =
                this.parseText(question.labels[i]) + ' >>>> ' + this.parseText(question.targets[parseInt(question.correct_answer[i])]) + ' ';
            } else {
              question.correct_answer[i] = this.parseText(question.labels[i]) + ' >>>> NONE ';
            }
          }
          break;
        case 'ordering':
          for( let i = 0; i < question.correct_answer.length; i++) {
            question.correct_answer[i] = `${i + 1}:` + ' ' + this.parseText(question.correct_answer[i]) + ' ';
          }
          break;
        case '':
          break;
        case '':
          break;
      }
    })
    this.questions = questions;
  }

  parseText(text: string) {
    if (text.includes('alt="')) {
      if(text.substring(text.indexOf('alt="') + 5, text.lastIndexOf('"'))) {
        text = text.substring(text.indexOf('alt="') + 5, text.lastIndexOf('"'));
      } else {
        text = this.stripHtml(text);
      }
    } else if (text.includes('>') && text.includes('<')) {
      text = this.stripHtml(text);
    }
    return text;
  }

  stripHtml(html){
    let  tmp = document.implementation.createHTMLDocument("New").body;

    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}

  backToSearch() {
    this.submitted = false;
    this.errorOccured = false;
    this.searchComplete = false;
    this.questions = [];
    this.title = '';
  }

  get short_id() {
    return this.form.get('short_id') as FormControl;
  }
}
