import { Controller, Post } from '@nestjs/common';
import { CrawlerService } from './crawler.service';

@Controller('crawler')
export class CrawlerController {
  constructor(private readonly crawlerService: CrawlerService) {}

  @Post()
  async retrivePlantData() {
    const links = await this.crawlerService.getLinks();
    const plantInfo = await this.crawlerService.getPlantInfo(links);
    return plantInfo;
  }
}
