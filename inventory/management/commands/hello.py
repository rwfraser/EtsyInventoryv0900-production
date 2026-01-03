from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = "Description of your command"

    def add_arguments(self, parser):
        parser.add_argument('arg1', type=int, help='An integer argument')

    def handle(self, *args, **kwargs):
        arg1 = kwargs['arg1']
        self.stdout.write(self.style.SUCCESS(f'Argument received: {arg1}'))
