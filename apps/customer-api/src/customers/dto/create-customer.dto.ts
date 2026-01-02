import { IsString, IsEmail, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName: string;

  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsOptional()
  @IsString()
  @Matches(/^[\d\s\-\+\(\)]+$/, { message: 'Phone number must contain only digits, spaces, dashes, plus signs, and parentheses' })
  @MaxLength(20)
  phone?: string;
}
