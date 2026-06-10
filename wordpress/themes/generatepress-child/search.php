<?php
/**
 * Template: Resultados de Búsqueda
 * Página de búsqueda interna con noindex, follow.
 *
 * @package GeneratePress Child
 */

get_header(); ?>

<div class="blog-layout-full">

    <?php pyablog_breadcrumbs(); ?>

    <div class="post-grid-wrap">
        <header class="search-header">
            <h1>Resultados para: <?php echo esc_html(get_search_query()); ?></h1>
            <?php get_search_form(); ?>
        </header>

        <?php if (have_posts()) : ?>
            <p style="font-size:0.85rem;color:#8A8A8A;margin-bottom:24px;">
                <?php
                global $wp_query;
                printf('%d artículo(s) encontrado(s).', $wp_query->found_posts);
                ?>
            </p>

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

            <div class="pagination-wrap">
                <?php
                echo paginate_links([
                    'mid_size'  => 2,
                    'prev_text' => '← Anterior',
                    'next_text' => 'Siguiente →',
                ]);
                ?>
            </div>

        <?php else : ?>
            <div class="empty-state">
                <p>No encontramos artículos con "<strong><?php echo esc_html(get_search_query()); ?></strong>".</p>
                <p>Sugerencias: pruebe con términos más generales, como "divorcio", "penal" o "laboral".</p>
                <a href="/blog/" class="back-link" style="display:inline;">← Ver todos los artículos</a>
            </div>
        <?php endif; ?>
    </div>
</div>

<?php get_footer(); ?>
