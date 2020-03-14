import { TestBed } from '@angular/core/testing';

import { QuestionsDataService } from './questions-data.service';

describe('QuestionsDataService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: QuestionsDataService = TestBed.get(QuestionsDataService);
    expect(service).toBeTruthy();
  });
});
