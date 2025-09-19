from django.db import models

class Banner(models.Model):
    image = models.ImageField(upload_to="banners/")
    overlay_text = models.CharField(max_length=200, blank=True, null=True)
    button_text = models.CharField(max_length=50, default="Shop Now")
    button_link = models.URLField(max_length=300, default="#")

    def __str__(self):
        return f"Banner {self.id}"

class Overview(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()

    def __str__(self):
        return self.title

class Category(models.Model):
    title = models.CharField(max_length=100)
    image = models.ImageField(upload_to="categories/")

    def __str__(self):
        return self.title
    

class AboutPage(models.Model):
    # Section 1
    section1_title = models.CharField(max_length=255)
    section1_content = models.TextField()

    # Section 2
    section2_title = models.CharField(max_length=255)
    section2_content = models.TextField()

    # Section 5 (two overlay images)
    overlay_image1 = models.ImageField(upload_to="about/")
    overlay_image2 = models.ImageField(upload_to="about/")

    def __str__(self):
        return "About Page Content"


class AboutImage(models.Model):
    """Section 3 - multiple images"""
    about_page = models.ForeignKey(AboutPage, related_name="images", on_delete=models.CASCADE)
    image = models.ImageField(upload_to="about/")

    def __str__(self):
        return f"Image {self.id} for AboutPage"


class AboutFeature(models.Model):
    """Section 4 - 3 features with title + text"""
    about_page = models.ForeignKey(AboutPage, related_name="features", on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    text = models.TextField()

    def __str__(self):
        return self.title


class ContactPage(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    image = models.ImageField(upload_to='contact/')
    form_title = models.CharField(max_length=200, default="Enquiry Form")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class ContactSubmission(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    message = models.TextField()
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Submission from {self.name}"