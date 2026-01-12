"""
Django management command to import earring settings from earring_settings_faceted.json
into the EnhancedInventory Component model.

Usage:
    python manage.py import_earring_settings [--file path/to/json] [--dry-run]
"""
import json
from decimal import Decimal
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from EnhancedInventory.models import Component


class Command(BaseCommand):
    help = 'Import earring settings from JSON file into Component model'

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            default='earring_settings_faceted.json',
            help='Path to JSON file (default: earring_settings_faceted.json)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview import without saving to database'
        )
        parser.add_argument(
            '--update',
            action='store_true',
            help='Update existing components if they exist (match by supplier_url)'
        )

    def handle(self, *args, **options):
        file_path = options['file']
        dry_run = options['dry_run']
        update_existing = options['update']

        # Load JSON data
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except FileNotFoundError:
            raise CommandError(f'File not found: {file_path}')
        except json.JSONDecodeError as e:
            raise CommandError(f'Invalid JSON file: {e}')

        self.stdout.write(f'Loaded {len(data)} records from {file_path}')
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No changes will be saved'))
        
        created_count = 0
        updated_count = 0
        skipped_count = 0
        errors = []

        # Process each record
        with transaction.atomic():
            for idx, record in enumerate(data, 1):
                try:
                    # Parse price (remove $ and convert to Decimal)
                    price_str = record['price'].replace('$', '').strip()
                    cost = Decimal(price_str)
                    
                    # Determine stock level from availability
                    stock_level = 10 if record['available_quantity'] == 'In Stock' else 0
                    
                    # Build specs JSON with all relevant fields
                    specs = {
                        'shape': record['gemstone_shape'],
                        'material': record['material'],
                        'gemstone_dimensions': record['gemstone_dimensions'],
                        'overall_dimensions': record['overall_dimensions'],
                        'product_number': record['product_number'],
                        'variant_id': record['variant_id']
                    }
                    
                    # Generate component name
                    name = f"{record['product_number']} - {record['material']} {record['gemstone_shape'].title()} Setting {record['gemstone_dimensions']}"
                    
                    # Check if component exists (by supplier_url which is unique)
                    existing = None
                    if update_existing:
                        try:
                            existing = Component.objects.get(supplier_url=record['product_url'])
                        except Component.DoesNotExist:
                            pass
                    
                    if existing:
                        # Update existing component
                        existing.name = name
                        existing.specs = specs
                        existing.cost_per_unit = cost
                        existing.stock_level = stock_level
                        
                        if not dry_run:
                            existing.save()
                        
                        updated_count += 1
                        self.stdout.write(f'  [{idx}/{len(data)}] Updated: {name}')
                    else:
                        # Check if URL already exists (to avoid duplicates)
                        if Component.objects.filter(supplier_url=record['product_url']).exists():
                            skipped_count += 1
                            self.stdout.write(
                                self.style.WARNING(f'  [{idx}/{len(data)}] Skipped (exists): {name}')
                            )
                            continue
                        
                        # Create new component
                        component = Component(
                            name=name,
                            component_type=Component.Type.SETTING,
                            specs=specs,
                            supplier_url=record['product_url'],
                            cost_per_unit=cost,
                            stock_level=stock_level,
                            reorder_point=5,
                            is_discontinued=False
                        )
                        
                        if not dry_run:
                            component.save()
                        
                        created_count += 1
                        self.stdout.write(f'  [{idx}/{len(data)}] Created: {name}')
                
                except Exception as e:
                    error_msg = f"Record {idx} ({record.get('product_number', 'UNKNOWN')}): {str(e)}"
                    errors.append(error_msg)
                    self.stdout.write(self.style.ERROR(f'  [{idx}/{len(data)}] ERROR: {error_msg}'))
            
            # Rollback if dry run
            if dry_run:
                transaction.set_rollback(True)
        
        # Summary
        self.stdout.write('\n' + '='*60)
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN COMPLETE - No changes saved'))
        else:
            self.stdout.write(self.style.SUCCESS('IMPORT COMPLETE'))
        
        self.stdout.write(f'Created: {created_count}')
        self.stdout.write(f'Updated: {updated_count}')
        self.stdout.write(f'Skipped: {skipped_count}')
        
        if errors:
            self.stdout.write(self.style.ERROR(f'Errors: {len(errors)}'))
            for error in errors:
                self.stdout.write(self.style.ERROR(f'  - {error}'))
        else:
            self.stdout.write(self.style.SUCCESS('No errors'))
        
        self.stdout.write('='*60)
