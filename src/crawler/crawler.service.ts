import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import * as puppeteer from 'puppeteer';
import { pageDown } from 'src/util/scrolling';

@Injectable()
export class CrawlerService {
  constructor(private prisma: PrismaService) {}

  async getLinks() {
    const browser = await puppeteer.launch({ headless: false });

    const page = await browser.newPage();
    try {
      await page.setViewport({
        width: 1080,
        height: 720,
      });

      let pageCount = 1;
      let result = [];
      while (pageCount <= 281) {
        await page.goto(`https://wildgreen.co.kr/plant?page=${pageCount}`, {
          waitUntil: 'networkidle0',
        });

        await pageDown(page);

        const linkInfo = await page.evaluate(() => {
          const arr = [];
          document
            .querySelectorAll('table > tbody > tr > td.title > a:nth-child(2)')
            .forEach((v: HTMLAnchorElement) => {
              arr.push(v.href);
            });
          return Promise.resolve(arr);
        });
        result.push(linkInfo);
        ++pageCount;
      }
      result = result.flat();
      return result;
    } catch (e) {
      console.error(e);
    } finally {
      await page.close();
      await browser.close();
    }
  }

  async getPlantInfo(link: string[]) {
    const limit = 12;
    const arrNum = Math.ceil(link.length / limit);
    const chunkArr: string[][] = [];
    for (let i = 0; i < arrNum; i++) {
      const chunk = link.splice(0, limit);
      chunkArr.push(chunk);
    }

    const result = [];

    for await (const chunk of chunkArr) {
      await Promise.all(
        chunk.map(async (v) => {
          const browser = await puppeteer.launch({ headless: false });

          const page = await browser.newPage();
          try {
            await page.goto(v, { waitUntil: 'domcontentloaded' });

            const plantData = await page.evaluate(() => {
              let family = null;
              let genus = null;
              let koreanName = null;
              let scientificName = null;
              let nickname = null;
              let origin = null;
              let distribution = null;
              let tall = null;
              let habitat = null;
              let overview = null;
              const img = document.querySelector(
                '#article > div.exOut.xe_content > ul > li:nth-child(1) > div > span > img',
              ) as HTMLImageElement;
              const imageUrl = img.src || null;
              document
                .querySelectorAll(
                  '#article > div.exOut.rhymix_content > table > tbody > tr',
                )
                .forEach((v) => {
                  const tHead = v.querySelector('th');
                  switch (tHead.innerText) {
                    case '과':
                      family = v.querySelector('td').innerText.split('(')[0];
                      break;
                    case '속':
                      genus = v.querySelector('td').innerText.split('(')[0];
                      break;
                    case '국명':
                      koreanName = v.querySelector('td').innerText;
                      break;
                    case '학명':
                      scientificName = v.querySelector('td').innerText;
                      break;
                    case '별명':
                      nickname = v.querySelector('td').innerText;
                      break;
                    case '원산지':
                      origin = v.querySelector('td').innerText;
                      break;
                    case '분포':
                      distribution = v.querySelector('td').innerText;
                      break;
                    case '전체크기':
                      tall = v.querySelector('td').innerText;
                      break;
                    case '서식지':
                      habitat = v.querySelector('td').innerText;
                      break;
                    case '개요':
                      overview = v.querySelector('td').innerText;
                      break;
                  }
                });
              const plantInfo = {
                family,
                genus,
                koreanName,
                scientificName,
                nickname,
                origin,
                distribution,
                tall,
                habitat,
                overview,
                imageUrl,
              };
              return Promise.resolve(plantInfo);
            });

            result.push(plantData);
          } catch (e) {
            console.error(e);
          } finally {
            await page.close();
            await browser.close();
          }
        }),
      );
    }

    try {
      for await (const data of result) {
        await this.prisma.$transaction(async () => {
          return await this.prisma.plant.createMany({ data });
        });
      }
      return true;
    } catch (e) {
      console.error(e);
    }
  }
}
