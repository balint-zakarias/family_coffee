#!/usr/bin/env python
import os
import sys
import django
from django.conf import settings
from django.test.utils import get_runner

if __name__ == "__main__":
    os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings.base'
    django.setup()
    TestRunner = get_runner(settings)
    test_runner = TestRunner()
    
    # Run specific app tests or all tests
    test_labels = sys.argv[1:] if len(sys.argv) > 1 else []
    
    failures = test_runner.run_tests(test_labels)
    if failures:
        sys.exit(bool(failures))
