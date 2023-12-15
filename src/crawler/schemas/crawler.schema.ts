import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { now } from 'mongoose';

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class Crawler {
  @Prop()
  family: string;

  @Prop()
  genus: string;

  @Prop({ unique: true })
  koreanName: string;

  @Prop()
  scientificName: string;

  @Prop({ required: false })
  nickname: string | null;

  @Prop({ required: false })
  origin: string | null;

  @Prop({ required: false })
  distribution: string | null;

  @Prop({ required: false })
  tall: string | null;

  @Prop({ required: false })
  habitat: string | null;

  @Prop({ required: false })
  overview: string | null;

  @Prop({ required: false })
  imageUrl: string | null;

  @Prop({ default: now() })
  createdAt: Date;

  @Prop({ default: now() })
  updatedAt: Date;
}

export const CrawlerSchema = SchemaFactory.createForClass(Crawler);
