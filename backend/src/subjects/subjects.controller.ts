import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('subjects')
export class SubjectsController {
  constructor(private subjectsService: SubjectsService) {}

  @Get()
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.subjectsService.findAll(includeInactive === 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subjectsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'TEACHER')
  @Post()
  create(
    @Body()
    dto: {
      name: string;
      nameUz?: string;
      description?: string;
      icon?: string;
      order?: number;
    },
  ) {
    return this.subjectsService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'TEACHER')
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body()
    dto: {
      name?: string;
      nameUz?: string;
      description?: string;
      icon?: string;
      isActive?: boolean;
      order?: number;
    },
  ) {
    return this.subjectsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subjectsService.remove(id);
  }
}
