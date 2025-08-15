from django.db import models


class ContactMessage(models.Model):
    name = models.CharField(max_length=160)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    message = models.TextField()
    handled = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["handled", "created_at"]),
        ]

    def __str__(self):
        return f"{self.name} – {self.email or self.phone} – {self.created_at:%Y-%m-%d %H:%M}"