from django import template

register = template.Library()

@register.filter(name='constructURl')
def constructURl(value):
    """Removes all values of arg from the given string"""
    return '-'.join(value.split('/'))