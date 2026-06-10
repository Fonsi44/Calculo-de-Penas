<?php
/**
 * Template: Blog Home
 * Página principal del blog con hero, category filter, featured post, grid, pagination y newsletter.
 *
 * @package GeneratePress Child
 */

get_header(); ?>

<div class="blog-layout-full">

    <!-- HERO -->
    <section class="blog-hero">
        <h1>Blog Jurídico de Pineda y Asociados</h1>
        <p class="subtitle">Análisis, guías y recursos legales sobre el derecho hondureño, escritos por nuestro equipo de abogados con sede en Nacaome, Valle.</p>
        <div class="blog-hero-actions">
            <a href="/solicitar-consulta" class="btn btn-primary">📬 Suscribirse al boletín</a>
            <a href="/blog/feed.xml" class="btn btn-outline" target="_blank" rel="noopener">📡 RSS Feed</a>
        </div>
    </section>

    <!-- CATEGORY FILTER -->
    <div class="category-filter-wrap">
        <nav class="category-filter" aria-label="Filtrar por categoría">
            <a href="/blog/" class="<?php echo !is_category() ? 'active' : ''; ?>">Todos</a>
            <?php
            $cats = get_categories(['orderby' => 'name', 'order' => 'ASC']);
            foreach ($cats as $cat) :
                $active = is_category($cat->slug) ? 'active' : '';
            ?>
                <a href="<?php echo esc_url(get_category_link($cat->term_id)); ?>" class="<?php echo $active; ?>"><?php echo esc_html($cat->name); ?></a>
            <?php endforeach; ?>
        </nav>
    </div>

    <?php if (have_posts()) : ?>

        <?php
        // Featured post (sticky or first)
        $featured = get_posts(['posts_per_page' => 1, 'post__in' => get_option('sticky_posts'), 'ignore_sticky_posts' => 1]);
        if (empty($featured)) {
            $featured = [get_posts(['posts_per_page' => 1])[0]];
        }
        $featured_post = $featured[0];
        setup_postdata($featured_post);
        ?>

        <!-- FEATURED POST -->
        <div class="featured-post-wrap">
            <article class="featured-post">
                <div class="featured-post-image">
                    <?php if (has_post_thumbnail($featured_post->ID)) : ?>
                        <?php echo get_the_post_thumbnail($featured_post->ID, 'large'); ?>
                    <?php endif; ?>
                </div>
                <div class="featured-post-body">
                    <?php pyablog_category_badge($featured_post->ID); ?>
                    <h2><a href="<?php echo esc_url(get_permalink($featured_post->ID)); ?>"><?php echo esc_html(get_the_title($featured_post->ID)); ?></a></h2>
                    <p><?php echo esc_html(wp_trim_words(get_the_excerpt($featured_post->ID), 30)); ?></p>
                    <div class="post-meta">
                        <time datetime="<?php echo get_the_date('c', $featured_post->ID); ?>"><?php echo get_the_date('j M Y', $featured_post->ID); ?></time>
                        <?php pyablog_reading_time_html(get_post_field('post_content', $featured_post->ID)); ?>
                    </div>
                </div>
            </article>
        </div>
        <?php wp_reset_postdata(); ?>

        <!-- POST GRID -->
        <div class="post-grid-wrap">
            <div class="post-grid">
                <?php while (have_posts()) : the_post(); ?>
                    <article class="grid-item">
                        <?php if (has_post_thumbnail()) : ?>
                        <div class="grid-item-image">
                            <?php the_post_thumbnail('medium'); ?>
                        </div>
                        <?php endif; ?>
                        <div class="grid-item-body">
                            <?php pyablog_category_badge(); ?>
                            <h3><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
                            <p><?php echo esc_html(wp_trim_words(get_the_excerpt(), 20)); ?></p>
                            <div class="post-meta">
                                <time datetime="<?php echo get_the_date('c'); ?>"><?php echo get_the_date('j M Y'); ?></time>
                                <?php pyablog_reading_time_html(); ?>
                            </div>
                        </div>
                    </article>
                <?php endwhile; ?>
            </div>

            <!-- PAGINATION -->
            <div class="pagination-wrap">
                <?php
                echo paginate_links([
                    'mid_size'  => 2,
                    'prev_text' => '← Anterior',
                    'next_text' => 'Siguiente →',
                ]);
                ?>
            </div>
        </div>

    <?php else : ?>
        <div class="empty-state">
            <p>Próximamente publicaremos nuestros primeros artículos.</p>
        </div>
    <?php endif; ?>

    <!-- NEWSLETTER -->
    <section class="newsletter-section">
        <div class="newsletter-inner">
            <h3>Reciba nuestros artículos en su correo</h3>
            <p>Sin spam. Solo contenido legal de calidad sobre el derecho hondureño.</p>
            <?php
            // Reemplazar con shortcode de Fluent Forms tras instalación
            echo do_shortcode('[fluentform id="1"]');
            ?>
        </div>
    </section>

</div>

<?php get_footer(); ?>
