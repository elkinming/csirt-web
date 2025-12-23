import { Component } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSpaceModule } from 'ng-zorro-antd/space';

@Component({
  selector: 'app-maintenance',
  imports: [NzCardModule, NzSpaceModule],
  templateUrl: './maintenance.component.html',
  styleUrl: './maintenance.component.less'
})
export class MaintenanceComponent {

}
